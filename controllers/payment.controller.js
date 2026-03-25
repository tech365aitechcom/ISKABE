const Stripe = require('stripe')

// Initialize Stripe with the restricted key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

exports.createPaymentIntent = async (req, res) => {
  const { paymentMethodId, amount, paymentData = {} } = req.body

  console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY)

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      description: paymentData.note || 'Payment',
      receipt_email: paymentData.receiptEmail || null,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    })

    console.log('Payment intent created:', paymentIntent.id)
    console.log('Payment intent status:', paymentIntent.status)
    console.log('Charges:', JSON.stringify(paymentIntent.charges, null, 2))

    // Get the charge and payment method details
    const charge = paymentIntent.charges?.data?.[0]

    // Get the payment method to extract card details
    let cardDetails = null
    if (paymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
        cardDetails = paymentMethod.card
        console.log('Payment method card details:', cardDetails)
      } catch (error) {
        console.error('Error retrieving payment method:', error)
      }
    }

    // Also try to get from charge if available
    if (!cardDetails && charge?.payment_method_details?.card) {
      cardDetails = charge.payment_method_details.card
    }

    const result = {
      transactionId: paymentIntent.id,
      chargeId: charge?.id || null,
      receiptUrl: charge?.receipt_url || null,
      last4: cardDetails?.last4 || null,
      cardBrand: cardDetails?.brand || null,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }

    console.log('Payment details:', result)

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('❌ Stripe payment error', error)

    let errorMessage = 'Payment failed'

    if (error.type === 'StripeCardError') {
      errorMessage = error.message
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid payment request. Please check your details.'
    } else {
      errorMessage = error.message || 'Payment processing failed'
    }

    return res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.message || 'Unknown error',
    })
  }
}
