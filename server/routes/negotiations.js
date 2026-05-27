const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
    createNegotiation,
    getNegotiation,
    getMyNegotiations,
    makeOffer,
    acceptOffer,
    declineOffer,
    sendMessage
} = require('../controllers/negotiationController')

router.get('/my', protect, getMyNegotiations)
router.get('/:id', protect, getNegotiation)
router.post('/', protect, createNegotiation)
router.post('/:id/offer', protect, makeOffer)
router.post('/:id/accept', protect, acceptOffer)
router.post('/:id/decline', protect, declineOffer)
router.post('/:id/message', protect, sendMessage)

module.exports = router