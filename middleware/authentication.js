
const CustomError = require('../errors')

const {isTokenValid} = require('../utils/jwt')

const authenticateUser = async (req,res,next) => {
    let token = req.signedCookies.token
    // if(!token){
    //     const authHeader = req.headers.authorization
    //     if(authHeader && authHeader.startsWith('Bearer ')){
    //         token = authHeader.split(' ')[1]
    //     }
    // }
    if(!token){
        throw new CustomError.UnauthenticatedError('Unauthorized to access this route')
    }
    try{
        const {userId,name,role} = isTokenValid(token)
        req.user = {userId,name,role}
        next()
    }catch(error){
        throw new CustomError.UnauthenticatedError('Invalid token provided')
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