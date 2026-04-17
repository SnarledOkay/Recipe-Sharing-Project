const {checkPermission,checkOwnerPermission} = require('./checkPermission')
const createTokenUser = require('./createTokenUser')
const {createJWT,isTokenValid,attachCookiesToResponse} = require('./jwt')

const sendEmail = require('./email/sendEmail')
const sendPasswordResetEmail = require('./email/sendPasswordResetEmail')
const sendVerifyAccountEmail = require('./email/sendVerifyAccountEmail')
const createHash = require('./createHash')

module.exports = {
    checkPermission, checkOwnerPermission,
    createTokenUser,
    createJWT, isTokenValid, attachCookiesToResponse,
    sendEmail,
    sendPasswordResetEmail,
    sendVerifyAccountEmail,
    createHash
}