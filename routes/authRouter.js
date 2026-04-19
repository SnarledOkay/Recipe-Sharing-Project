
const express = require('express')
const router = express.Router()
const {authenticateUser} = require('../middleware/authentication')

const {
    registerUser,
    // verifyEmail,
    login,
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/authController')

router.route('/register-user').post(registerUser)
// router.route('/verify-email').post(verifyEmail)
router.route('/login').post(login)
router.route('/logout').delete(authenticateUser,logout)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password').post(resetPassword)

module.exports = router

