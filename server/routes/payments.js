const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { paymentLimit } = require('../middleware/security')
const {
    initiatePayment,
    mpesaCallback,
    confirmPickup,
    getTransaction,
    raiseDispute
} = require('../controllers/paymentController')

router.post('/initiate', protect, paymentLimit, initiatePayment)
router.post('/callback', mpesaCallback)
router.post('/confirm-pickup', protect, confirmPickup)
router.get('/transaction/:id', protect, getTransaction)
router.post('/dispute/:id', protect, raiseDispute)

module.exports = router