const jwt = require('jsonwebtoken')
const UtilityFunction = require('../utils')

const createJWT = ({payload}) => {
    //currently no need for JWT_LIFETIME
    const token = jwt.sign(payload,process.env.JWT_SECRET)
    return token
}

const isTokenValid = ({token}) => jwt.verify(token,process.env.JWT_SECRET)

const attachCookiesToResponse = ({res,user,refreshToken}) => {
    //refreshToken are already hashed before
    //refreshTokenJWT has been turned into JWT for more security
    const accessTokenJWT = createJWT({payload:user})
    const refreshTokenJWT = createJWT({payload:{user,refreshToken}})

    const oneMonth = 1000*60*60*24*30;
    const thirtyMinutes = 1000*60*30;
    res.cookie('accessToken',accessTokenJWT,{
        httpOnly:true,
        maxAge:thirtyMinutes,
        secure:process.env.NODE_ENV === 'production',
        signed:true,
    })
    res.cookie('refreshToken',refreshTokenJWT,{
        httpOnly:true,
        maxAge:oneMonth,
        secure:process.env.NODE_ENV === 'production',
        signed:true
    })
}

module.exports = {
    createJWT,
    isTokenValid,
    attachCookiesToResponse
}