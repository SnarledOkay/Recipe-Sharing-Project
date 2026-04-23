
const CustomError = require('../errors')
const Token = require('../model/Token')
const jwt = require('jsonwebtoken')

const UtilityFunction = require('../utils')

const authenticateUser = async (req,res,next) => {
    const {accessToken,refreshToken} = req.signedCookies
    try{
        //If access token is valid
        if(accessToken){
            const payload = UtilityFunction.isTokenValid(accessToken);
            req.user = payload.user
            return next()
        };
        //Decode 'refreshToken' cookie to extract refreshToken
        const payload = UtilityFunction.isTokenValid(refreshToken);
        //find refresh token
        const existingToken = await Token.findOne({
            user:payload.user.userId,
            refreshToken:payload.refreshToken,
        })
        console.log(payload.refreshToken);
        console.log(existingToken);
        //Check if token is still valid
        if(!existingToken || !existingToken?.isValid){
            throw new CustomError.UnauthenticatedError('Authentication failed!')
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