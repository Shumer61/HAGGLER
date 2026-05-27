const sendSMS = async ({ phone, message }) => {
    try {
        if(process.env.NODE_ENV === 'development') {
            console.log(`[SMS to ${phone}]: ${message}`)
            return { success: true }
        }

        const AfricasTalking = require('africastalking')
        const at = AfricasTalking({
            apiKey:   process.env.AFRICAS_TALKING_API_KEY,
            username: process.env.AFRICAS_TALKING_USERNAME
        })

        const result = await at.SMS.send({
            to:      [phone],
            message,
            from:    'HAGGLER'
        })

        return { success: true, result }
    } catch(error) {
        console.warn('SMS failed:', error.message)
        return { success: false, error: error.message }
    }
}

module.exports = sendSMS