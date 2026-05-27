const Transaction = require('../models/Transaction')
const Negotiation = require('../models/Negotiation')
const Item = require('../models/Item')
const User = require('../models/User')
const { stkPush } = require('../config/mpesa')
const { generateOTP, generatePickupCode } = require('../utils/generateOTP')
const sendSMS = require('../utils/sendSMS')

const initiatePayment = async (req, res) => {
    try {
        const { negotiationId, pickupMethod, phone } = req.body

        const negotiation = await Negotiation.findById(negotiationId)
            .populate('item')

        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })
        if(negotiation.status !== 'agreed') return res.status(400).json({ message: 'Negotiation not agreed yet' })
        if(negotiation.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the buyer can initiate payment' })
        }

        // check no duplicate transaction
        const existing = await Transaction.findOne({ negotiation: negotiationId, status: { $in: ['paid', 'collected', 'completed'] } })
        if(existing) return res.status(400).json({ message: 'Already paid' })

        // amount comes from database not client
        const amount = negotiation.agreedPrice

        const mpesaRes = await stkPush({
            phone,
            amount,
            accountRef: `HAG-${negotiationId.toString().slice(-6).toUpperCase()}`,
            transactionDesc: `Haggler payment for ${negotiation.item.title}`
        })

        if(!mpesaRes.CheckoutRequestID) {
            return res.status(500).json({ message: 'Payment initiation failed' })
        }

        const transaction = await Transaction.create({
            negotiation: negotiationId,
            buyer: req.user._id,
            seller: negotiation.seller,
            item: negotiation.item._id,
            amount,
            checkoutRequestId: mpesaRes.CheckoutRequestID,
            pickupMethod: pickupMethod || 'in_person'
        })

        res.json({
            message: 'Payment prompt sent to your phone',
            transactionId: transaction._id,
            checkoutRequestId: mpesaRes.CheckoutRequestID
        })
    } catch(error) {
        console.warn('payment error:', error.message)
        res.status(500).json({ message: error.message })
    }
}

const mpesaCallback = async (req, res) => {
    try {
        const { Body } = req.body
        const result = Body?.stkCallback

        if(!result) return res.status(400).json({ message: 'Invalid callback' })

        const { CheckoutRequestID, ResultCode, CallbackMetadata } = result

        const transaction = await Transaction.findOne({ checkoutRequestId: CheckoutRequestID })
        if(!transaction) return res.status(200).json({ message: 'Transaction not found — ignored' })

        // idempotency check
        if(transaction.status !== 'pending') return res.status(200).json({ message: 'Already processed' })

        if(ResultCode !== 0) {
            transaction.status = 'pending'
            await transaction.save()
            return res.status(200).json({ message: 'Payment failed' })
        }

        const items = CallbackMetadata?.Item || []
        const mpesaRef = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value

        const otp = generateOTP()
        const pickupCode = generatePickupCode()

        transaction.status = 'paid'
        transaction.mpesaRef = mpesaRef
        transaction.otp = otp
        transaction.pickupCode = pickupCode
        await transaction.save()

        // update negotiation and item
        await Negotiation.findByIdAndUpdate(transaction.negotiation, { status: 'paid' })
        await Item.findByIdAndUpdate(transaction.item, { status: 'sold' })

        // notify buyer with pickup code
        const buyer = await User.findById(transaction.buyer)
        await sendSMS({
            phone: buyer.phone,
            message: `Payment confirmed! Your pickup code is ${pickupCode}. Show this when collecting your item.`
        })

        // notify seller
        const seller = await User.findById(transaction.seller)
        await sendSMS({
            phone: seller.phone,
            message: `Payment received for your item. Buyer will collect using code: ${pickupCode}`
        })

        res.status(200).json({ message: 'Callback processed' })
    } catch(error) {
        console.warn('callback error:', error.message)
        res.status(200).json({ message: 'Callback error handled' })
    }
}

const confirmPickup = async (req, res) => {
    try {
        const { pickupCode } = req.body

        const transaction = await Transaction.findOne({ pickupCode, status: 'paid' })
        if(!transaction) return res.status(404).json({ message: 'Invalid pickup code' })

        transaction.status = 'completed'
        transaction.confirmedAt = new Date()
        await transaction.save()

        res.json({ message: 'Pickup confirmed — transaction complete' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('item', 'title images')
            .populate('buyer', 'name phone')
            .populate('seller', 'name phone')

        if(!transaction) return res.status(404).json({ message: 'Transaction not found' })

        const isParty = transaction.buyer._id.toString() === req.user._id.toString() ||
                        transaction.seller._id.toString() === req.user._id.toString() ||
                        req.user.role === 'platform_admin'

        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        res.json(transaction)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const raiseDispute = async (req, res) => {
    try {
        const { reason } = req.body
        const transaction = await Transaction.findById(req.params.id)

        if(!transaction) return res.status(404).json({ message: 'Transaction not found' })

        const isParty = transaction.buyer.toString() === req.user._id.toString() ||
                        transaction.seller.toString() === req.user._id.toString()
        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        transaction.status = 'disputed'
        transaction.disputeReason = reason
        await transaction.save()

        res.json({ message: 'Dispute raised — admin will review within 24 hours' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = { initiatePayment, mpesaCallback, confirmPickup, getTransaction, raiseDispute }