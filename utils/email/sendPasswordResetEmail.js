const sendEmail = require('./sendEmail')

const sendPasswordResetEmail = ({name,email,passwordResetToken,origin}) => {
    const passwordResetUrl = `${origin}/auth/reset-password/email=${email}&token=${passwordResetToken}`
    const message = `<p>Click on this link to reset password: <a href = "${passwordResetUrl}">Reset Password</a>`
    return sendEmail({
        to: email,
        subject: 'Reset your password',
        html: `<h4>Hello, user ${name}
        ${message}`
    })
}

module.exports = sendPasswordResetEmail