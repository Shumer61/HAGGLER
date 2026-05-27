const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'platform_admin'],
        default: 'buyer'
    },
    avatar: {
        type: String,
        default: null
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    phoneOTP: String,
    phoneOTPExpiry: Date,
    sellerStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'suspended'],
        default: 'none'
    },
    sellerProfile: {
        storeName:       { type: String, default: null },
        storeDescription:{ type: String, default: null },
        idVerified:      { type: Boolean, default: false },
        approvedAt:      { type: Date, default: null },
        approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    rating: {
        average: { type: Number, default: 0 },
        count:   { type: Number, default: 0 }
    },
    acceptedTermsAt: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

UserSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', UserSchema)