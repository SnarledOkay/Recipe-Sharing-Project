
const {StatusCodes} = require('http-status-codes')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const User = require('../model/User')
const Token = require('../model/Token')

const CustomError = require('../errors')
const UtilityFunction = require('../utils')

const registerUser = async (req,res) => {
    const {name,email,password} = req.body
    if(!name || !email || !password){
        throw new CustomError.BadRequestError('Some fields are missing')
    }
    const emailAlreadyExists = await User.findOne({email:email})
    if(emailAlreadyExists){
        throw new CustomError.UniqueConflictError('Email is already in use')
    }
    const isFirstUser = (await User.countDocuments({})) === 0 ;
    const role = isFirstUser ? 'admin' : 'user' ;
    
    //This is just a random string, not hashed
    // const verificationToken = crypto.randomBytes(70).toString('hex');
    const user = await User.create({name,email,password,role,
        isVerified:true,
        verifiedAt: new Date(Date.now())
    })
    // user.isVerified = true ;
    // user.verifiedAt = new Date(Date.now())
    // await user.save() //needs to save these changes

    // const origin = 'http://localhost:3000'
    // await UtilityFunction.sendVerifyAccountEmail({
    //     name:user.name,
    //     email:user.email,
    //     verificationToken,
    //     origin
    // })
    // user.verificationToken = UtilityFunction.createHash(verificationToken)
    // res.status(StatusCodes.CREATED).json({msg:'Please check your email to verify account'})
    res.status(StatusCodes.CREATED).json({msg:'Account created!'})
}

// const verifyEmail = async (req,res) => {
//     const {email,token} = req.query
//     const user = await User.findOne({email:email})
//     if(user){
//         if(user.verificationToken === UtilityFunction.createHash(token)){
//             user.isVerified = true ;
//             user.verificationToken = ''
//             user.verifiedAt = new Date(Date.now())
//         }else{
//             throw new CustomError.UnauthenticatedError('Email verification failed!')
//         }
//     }
//     res.status(StatusCodes.OK).json({msg:'Email verified successfully'})
// }

const login = async (req,res) => {
    const {email,password} = req.body
    if(!email || !password){
        throw new CustomError.BadRequestError('Please provide all necessary fields')
    }
    const user = await User.findOne({email:email})
    if(!user){
        throw new CustomError.BadRequestError('Invalid credentials')
    }
    const isPasswordMatch = await UtilityFunction.comparePassword(password,user.password)
    if(!isPasswordMatch){
        throw new CustomError.BadRequestError('Invalid credentials')
    }
    if(!user.isVerified){
        throw new CustomError.UnauthenticatedError('Account is not yet verified')
    }

    const tokenUser = await UtilityFunction.createTokenUser(user)
    const existingToken = await Token.findOne({user:user._id})
    if(existingToken){
        const {isValid,refreshToken} = existingToken ;
        if(!isValid){
            throw new CustomError.UnauthenticatedError('Invalid credentials')
        }
        UtilityFunction.attachCookiesToResponse({res,user:tokenUser,refreshToken})
        res.status(StatusCodes.OK).json({
            tokenUser,
            status:'Refresh token found',
        })
        return
    }
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const userAgent = req.headers['user-agent']
    const ip = req.ip
    await Token.create({refreshToken,ip,userAgent,user:user._id})
    UtilityFunction.attachCookiesToResponse({
        res,
        user:tokenUser,
        refreshToken
    })
    res.status(StatusCodes.OK).json({
        tokenUser,
        status:'New refresh token created'
    })
}

const logout = async (req,res) => {
    console.log(req.user)
    await Token.findOneAndDelete({user:req.user.userId})
    res.cookie('accessToken','logout',{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.cookie('refreshToken','logout',{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.status(StatusCodes.OK).json({msg:`Logged out successfully!`})
}

const forgotPassword = async (req,res) => {
    const {email} = req.body
    if(!email){
        throw new CustomError.BadRequestError('Please enter valid email')
    }
    const user = await User.findOne({email:email})
    if(user){
        const passwordResetToken = crypto.randomBytes(70).toString('hex')
        const fifteenMinutes = 1000*60*15 ;
        const origin = 'http://localhost:3000'
        await UtilityFunction.sendPasswordResetEmail({
            name:user.name,
            email:user.email,
            passwordResetToken,
            origin
        })
        user.passwordResetToken = UtilityFunction.createHash(passwordResetToken)
        user.passwordResetTokenExpiration = new Date(Date.now()+fifteenMinutes)
    }
    res.status(StatusCodes.OK).json({msg:'Check your email to reset your password'})
}

const resetPassword = async (req,res) => {
    const {
        query: {email,token},
        body: {password}
    } = req 
    const user = await User.findOne({email:email})
    if(user){
        const currentDate = new Date(Date.now());
        //do not throw error even if passwordResetToken doesn't match or it has expired
        //compare public token to hashed token (1-way process so safe)
        if(user.passwordResetToken === UtilityFunction.createHash(token) && user.passwordResetTokenExpiration > currentDate){
            user.password = password 
            user.passwordResetToken = null
            user.passwordResetTokenExpiration = null
            await user.save()
        }
    }
    res.status(StatusCodes.OK).json({msg:'Password changed successfully!'})
}

const refreshToken = async (req,res) => {
    res.status(StatusCodes.OK).json({msg:'Access Token refreshed!'})
}

module.exports = {
    registerUser,
    // verifyEmail,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken
}