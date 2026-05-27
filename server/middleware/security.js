const rateLimit = require('express-rate-limit')

const globalLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

const paymentLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { message: 'Too many payment requests' }
})

module.exports = { globalLimit, authLimit, paymentLimit }