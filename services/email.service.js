const nodemailer = require('nodemailer')
const config = require('../config/config')

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
})

exports.sendVerificationEmail = async (email, verificationLink) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Account Registration and Verification',
    html: `
      <div style="max-width:600px;margin:0 auto;border:1px solid #ccc;font-family:Arial,sans-serif;">
        <div style="background-color:#333333;color:#ffffff;padding:20px;text-align:center;">
          <h2>Thank You for Creating Your ISKA Fight Platform Account!</h2>
        </div>
        <div style="padding:20px;color:#000000;">
          <p>Your ISKA Fight Platform account will enable you to register to participate in events, to get an ISKA Premium Fighter profile, to be included in ISKA fighter rankings, to predict bout outcomes, to rate bouts, and much more!</p>
          
          <p><strong>Click the link below to verify your email.</strong> Doing so will allow you to begin using the members-only features from the ISKA Fight Platform.</p>

          <p><a href="${verificationLink}">${verificationLink}</a></p>

          <p>After you complete your registration, you'll be able to log in with your email address and password.</p>

          <p><strong>Be sure to check out the Premium Profile upgrade:</strong> 
          <a href="https://www.ikffightplatform.com/upgrade" target="_blank">https://www.ikffightplatform.com/upgrade</a>. 
          It’s a great way to put your best foot forward as a fighter.</p>

          <p>If you have any questions, suggestions, or comments, feel free to drop us a line at 
          <a href="mailto:ikffightplatform@gmail.com">ikffightplatform@gmail.com</a></p>

          <p>Thanks!<br/>The ISKA Fight Platform Team</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

exports.sendForgotPasswordEmail = async (email, resetLink) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset',
    html: `
      <p>You recently asked to reset your ISKA Fight Platform password.</p>
      <p>To change your password, either click the following link or paste it into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you cannot successfully change your password and/or log in, please contact us at <a href="mailto:ikffightplatform@gmail.com">ikffightplatform@gmail.com</a>.</p>
      <p>Thank you!</p>
      <p>The ISKA Fight Platform Team</p>
      <p>Powered by Fight Sports Insider ©2025</p>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${email}`)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error // Re-throw to be handled by the controller
  }
}
