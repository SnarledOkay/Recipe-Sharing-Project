
const CustomError = require('../errors')
const Token = require('../model/Token')
const jwt = require('jsonwebtoken')

const UtilityFunction = require('../utils')

const authenticateUser = async (req,res,next) => {
    const {accessToken,refreshToken} = req.signedCookies
    try{
        //If access token is valid
        if(accessToken){
            console.log(accessToken)
            console.log('1 - Start decoding access token');
            const payload = UtilityFunction.isTokenValid(accessToken);
            console.log('2 - Finish decoding access token');
            console.log(payload)
            req.user = payload
            return next()
        };
        //If refresh token is still valid, create new access token
        const payload = isTokenValid(refreshToken);
        const existingToken = await Token.findOne({
            user:payload.userId,
            refreshToken:payload.refreshToken,
        })
        if(!existingToken || !existingToken?.isValid){
            throw new CustomError.UnauthenticatedError('Authentication failed')
        }
        //attach new cookies again to response
        UtilityFunction.attachCookiesToResponse({
            res,
            user:payload.user,
            refreshToken
        });
        req.user = payload.user; //'isTokenValid' returns an object of form 'user:{userId,name,role}'
        next()
    }catch(error){
        console.log(error)
        throw new CustomError.UnauthenticatedError('Invalid credentials!')
    }
}

const authorizePermission = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            throw new CustomError.UnauthorizedError('Unauthorized to perform this action')
        }
        next()
    }
}

module.exports = {
    authenticateUser,
    authorizePermission
}