const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized' })
    }

    try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        req.user = await User.findById(decoded.id).select('-password')

        if(!req.user) {
            return res.status(401).json({ message: 'User not found' })
        }

        next()
    } catch(error) {
        return res.status(401).json({ message: 'Token invalid or expired' })
    }
}

const refreshTokenProtect = async (req, res, next) => {
    const token = req.cookies.refreshToken

    if(!token) {
        return res.status(401).json({ message: 'No refresh token' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
        req.userId = decoded.id
        next()
    } catch(error) {
        return res.status(401).json({ message: 'Refresh token invalid' })
    }
}

module.exports = { protect, refreshTokenProtect }