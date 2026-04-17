const nodemailer= require('nodemailer')
const nodemailerConfig=require('./nodemailerConfig')

const sendEmail = async ({to,subject,html})=>{
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport(nodemailerConfig)
    const info = await transporter.sendMail({
        from: `Cao Huy <${process.env.SENDER_EMAIL}>` ,
        to,
        subject,
        html
    })
}

module.exports = sendEmail