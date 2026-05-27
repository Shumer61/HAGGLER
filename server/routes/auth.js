const express = require('express')
const router = express.Router()
const { protect, refreshTokenProtect } = require('../middleware/auth')
const { platformAdminOnly } = require('../middleware/roles')
const {
    register,
    login,
    logout,
    refreshToken,
    getMe,
    applyToSell,
    verifyPhone
} = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refreshTokenProtect, refreshToken)
router.get('/me', protect, getMe)
router.post('/apply-seller', protect, applyToSell)
router.post('/verify-phone', protect, verifyPhone)

router.get('/sellers', protect, platformAdminOnly, async (req, res) => {
    try {
        const User = require('../models/User')
        const sellers = await User.find({
            role: 'seller',
            sellerStatus: 'approved'
        }).select('name email phone sellerProfile')
        res.json(sellers)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router