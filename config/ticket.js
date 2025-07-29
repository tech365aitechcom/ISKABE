const QRCode = require('qrcode')

exports.generateTicketCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

exports.generateQRCode = async (data) => {
  try {
    return await QRCode.toBuffer(data)
  } catch (error) {
    console.error('Failed to generate QR Code:', error)
    throw error
  }
}
