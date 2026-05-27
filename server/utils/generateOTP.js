const crypto = require('crypto')

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString()
}

const generatePickupCode = () => {
    const prefix = 'HG'
    const code = crypto.randomInt(1000, 9999).toString()
    return `${prefix}-${code}`
}

module.exports = { generateOTP, generatePickupCode }