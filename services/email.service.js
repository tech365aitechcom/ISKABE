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

exports.sendTicketConfirmationEmail = async ({
  to,
  name,
  eventTitle,
  eventLink,
  purchaseDate,
  tierTitle,
  tiers,
  quantity,
  totalAmount,
  ticketCode,
  qrCodeBuffer,
}) => {
  if (!to || !ticketCode || !qrCodeBuffer) {
    console.warn('Missing required fields for sending ticket email')
    return
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject: `IKF Event Ticket Summary`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;border:1px solid #ddd;">
        <div style="background-color:#000;color:#fff;padding:20px;text-align:center;">
          <h2>IKF FIGHT PLATFORM</h2>
          <p>Your Spectator Ticket</p>
        </div>
        <div style="padding:20px;color:#000;">
          <p>Hi ${name || 'guest'},</p>
          <p>You purchased ${quantity} ticket(s) for the following event: 
            <a href="${eventLink}" style="color:#0000ee;">${eventTitle}</a>
          </p>
          ${tiers && tiers.length > 1 
            ? `<p style="font-size:14px;">Your purchase includes multiple ticket tiers as detailed below.</p>`
            : ''
          }
          <div style="text-align:center;margin:20px 0;">
            <img src="cid:qrCode123" alt="QR Code" style="width:200px;height:200px;" />
          </div>

          <p style="font-size:14px;">You can also show the following code to the official(s) at the gate to gain entry:</p>
          <h3 style="text-align:center;color:#FF9900;">${ticketCode}</h3>

          <p style="font-size:12px;">
            Note that your code can only be used by you, only once, and only for this event.
            You may be required to identify your email address at the door.
          </p>

          <h4>Purchase Summary:</h4>
          <div style="background-color:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
            <p style="margin:5px 0;"><strong>Purchase Date:</strong> ${new Date(purchaseDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            
            <h5 style="margin:15px 0 10px 0;color:#333;">Tickets Purchased:</h5>
            <table style="width:100%;border-collapse:collapse;margin:10px 0;">
              ${tiers && tiers.length > 0 
                ? tiers.map(tier => 
                    `<tr style="border-bottom:1px solid #ddd;">
                      <td style="padding:8px 0;font-weight:500;">${tier.tierName}</td>
                      <td style="padding:8px 0;text-align:center;">${tier.quantity}</td>
                      <td style="padding:8px 0;text-align:right;">$${tier.price.toFixed(2)}</td>
                      <td style="padding:8px 0;text-align:right;font-weight:bold;">$${(tier.price * tier.quantity).toFixed(2)}</td>
                    </tr>`
                  ).join('')
                : `<tr style="border-bottom:1px solid #ddd;">
                    <td style="padding:8px 0;font-weight:500;">${tierTitle}</td>
                    <td style="padding:8px 0;text-align:center;">${quantity}</td>
                    <td style="padding:8px 0;text-align:right;">$${(totalAmount / quantity).toFixed(2)}</td>
                    <td style="padding:8px 0;text-align:right;font-weight:bold;">$${totalAmount.toFixed(2)}</td>
                  </tr>`
              }
              <tr style="border-top:2px solid #333;background-color:#e9ecef;">
                <td style="padding:12px 0;font-weight:bold;" colspan="3">Total Amount</td>
                <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:18px;color:#28a745;">$${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:12px;margin-top:20px;">
            If you have any questions, contact us at <a href="mailto:ikffightplatform@gmail.com">ikffightplatform@gmail.com</a>.
          </p>
          <p style="font-size:12px;">Thank you!<br/>The IKF Fight Platform Team</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'ticket-qr.png',
        content: qrCodeBuffer,
        cid: 'qrCode123',
      },
    ],
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Ticket email sent to ${to}`)
  } catch (error) {
    console.error('Error sending ticket email:', error)
    throw error
  }
}
