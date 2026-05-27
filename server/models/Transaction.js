const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
    negotiation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Negotiation',
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
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    mpesaRef: {
        type: String,
        default: null
    },
    checkoutRequestId: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    pickupCode: {
        type: String,
        default: null
    },
    pickupMethod: {
        type: String,
        enum: ['pick_up_mtaani', 'cbd_shelf', 'in_person'],
        default: 'in_person'
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'collected', 'completed', 'disputed', 'refunded'],
        default: 'pending'
    },
    disputeReason: {
        type: String,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    confirmedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

module.exports = mongoose.model('Transaction', TransactionSchema)