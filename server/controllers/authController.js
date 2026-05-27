const User = require('../models/User')
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken')
const { generateOTP } = require('../utils/generateOTP')
const sendSMS = require('../utils/sendSMS')

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

const register = async (req, res) => {
    try {
        const { name, email, password, phone, acceptedTerms } = req.body

        if(!acceptedTerms) {
            return res.status(400).json({ message: 'You must accept the terms and conditions' })
        }

        if(typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' })
        }

        const exists = await User.findOne({ $or: [{ email }, { phone }] })
        if(exists) {
            return res.status(400).json({ message: 'Email or phone already registered' })
        }

        const user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password,
            phone,
            acceptedTermsAt: new Date()
        })

        const accessToken = generateAccessToken(user._id)
        const refreshTokenVal = generateRefreshToken(user._id)

        user.refreshToken = refreshTokenVal
        await user.save({ validateBeforeSave: false })

        setRefreshCookie(res, refreshTokenVal)

        res.status(201).json({
            _id:    user._id,
            name:   user.name,
            email:  user.email,
            phone:  user.phone,
            role:   user.role,
            sellerStatus: user.sellerStatus,
            accessToken
        })
    } catch(error) {
        console.warn('register error:', error.message)
        res.status(500).json({ message: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if(typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+password')

        if(!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        if(!user.isActive) {
            return res.status(403).json({ message: 'Account suspended' })
        }

        const accessToken = generateAccessToken(user._id)
        const refreshTokenVal = generateRefreshToken(user._id)

        user.refreshToken = refreshTokenVal
        await user.save({ validateBeforeSave: false })

        setRefreshCookie(res, refreshTokenVal)

        res.json({
            _id:    user._id,
            name:   user.name,
            email:  user.email,
            phone:  user.phone,
            role:   user.role,
            sellerStatus: user.sellerStatus,
            sellerProfile: user.sellerProfile,
            accessToken
        })
    } catch(error) {
        console.warn('login error:', error.message)
        res.status(500).json({ message: error.message })
    }
}

const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken
        if(token) {
            const user = await User.findOne({ refreshToken: token })
            if(user) {
                user.refreshToken = null
                await user.save({ validateBeforeSave: false })
            }
        }
        res.clearCookie('refreshToken')
        res.json({ message: 'Logged out' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const refreshToken = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if(!user) return res.status(401).json({ message: 'User not found' })

        const accessToken = generateAccessToken(user._id)
        const newRefreshToken = generateRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save({ validateBeforeSave: false })

        setRefreshCookie(res, newRefreshToken)
        res.json({ accessToken })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getMe = async (req, res) => {
    res.json(req.user)
}

const applyToSell = async (req, res) => {
    try {
        const { storeName, storeDescription } = req.body
        const user = req.user

        if(user.sellerStatus === 'pending') {
            return res.status(400).json({ message: 'Application already pending' })
        }
        if(user.sellerStatus === 'approved') {
            return res.status(400).json({ message: 'Already an approved seller' })
        }

        user.sellerStatus = 'pending'
        user.sellerProfile = { storeName, storeDescription }
        await user.save({ validateBeforeSave: false })

        res.json({ message: 'Application submitted — you will be notified once approved' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const verifyPhone = async (req, res) => {
    try {
        const { otp } = req.body
        const user = req.user

        if(!user.phoneOTP || !user.phoneOTPExpiry) {
            return res.status(400).json({ message: 'No OTP found — request a new one' })
        }

        if(new Date() > user.phoneOTPExpiry) {
            return res.status(400).json({ message: 'OTP expired' })
        }

        if(user.phoneOTP !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' })
        }

        user.isPhoneVerified = true
        user.phoneOTP = undefined
        user.phoneOTPExpiry = undefined
        await user.save({ validateBeforeSave: false })

        res.json({ message: 'Phone verified successfully' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = { register, login, logout, refreshToken, getMe, applyToSell, verifyPhone }