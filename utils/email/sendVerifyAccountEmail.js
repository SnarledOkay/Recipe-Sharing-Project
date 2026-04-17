const sendEmail = require('./sendEmail')

const sendVerifyAccountEmail = ({name,email,verificationToken,origin}) => {
    const verifyAccountUrl = `${origin}/auth/verify-email?email=${email}&token=${verificationToken}`
    const message = `<p>Click on this link to verify email: <a href = "${verifyAccountUrl}">Verify Email<a/></p>`
    return sendEmail({
        email,
        subject: 'Verify Email',
        html:`<h4>Hello, user ${name}
        ${message}`
    })
}

module.exports = sendVerifyAccountEmail