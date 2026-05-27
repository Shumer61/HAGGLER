const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['offer', 'counter', 'message', 'accept', 'decline', 'system'],
        required: true
    },
    amount: {
        type: Number,
        default: null
    },
    text: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

const NegotiationSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'agreed', 'cancelled', 'expired', 'paid'],
        default: 'active'
    },
    currentOffer: {
        type: Number,
        default: null
    },
    agreedPrice: {
        type: Number,
        default: null
    },
    messages: [MessageSchema],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
}, { timestamps: true })

module.exports = mongoose.model('Negotiation', NegotiationSchema)