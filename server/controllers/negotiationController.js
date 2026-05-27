const Negotiation = require('../models/Negotiation')
const Item = require('../models/Item')
const sendSMS = require('../utils/sendSMS')
const User = require('../models/User')

const createNegotiation = async (req, res) => {
    try {
        const { itemId, initialOffer } = req.body

        const item = await Item.findById(itemId).populate('seller')
        if(!item || item.status === 'sold' || !item.isActive) {
            return res.status(404).json({ message: 'Item not available' })
        }

        if(item.seller._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot negotiate on your own item' })
        }

        // enforce 75% floor
        if(initialOffer < item.floorPrice) {
            return res.status(400).json({
                message: `Minimum offer is KSh ${item.floorPrice}`,
                floorPrice: item.floorPrice
            })
        }

        // check if negotiation already exists
        const existing = await Negotiation.findOne({
            item: itemId,
            buyer: req.user._id,
            status: 'active'
        })
        if(existing) {
            return res.status(400).json({ message: 'You already have an active negotiation on this item' })
        }

        const negotiation = await Negotiation.create({
            item: itemId,
            buyer: req.user._id,
            seller: item.seller._id,
            currentOffer: initialOffer,
            messages: [{
                sender: req.user._id,
                type: 'offer',
                amount: initialOffer
            }]
        })

        // increment bid count on item
        item.bidCount += 1
        item.status = 'negotiating'
        await item.save()

        // notify seller via SMS
        await sendSMS({
            phone: item.seller.phone,
            message: `New offer on your ${item.title}: KSh ${initialOffer}. Open Haggler to respond.`
        })

        res.status(201).json(negotiation)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getNegotiation = async (req, res) => {
    try {
        const negotiation = await Negotiation.findById(req.params.id)
            .populate('item')
            .populate('buyer', 'name phone')
            .populate('seller', 'name phone')
            .populate('messages.sender', 'name')

        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })

        const isParty = negotiation.buyer._id.toString() === req.user._id.toString() ||
                        negotiation.seller._id.toString() === req.user._id.toString() ||
                        req.user.role === 'platform_admin'

        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        res.json(negotiation)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getMyNegotiations = async (req, res) => {
    try {
        const negotiations = await Negotiation.find({
            $or: [{ buyer: req.user._id }, { seller: req.user._id }]
        })
        .populate('item', 'title images price')
        .populate('buyer', 'name')
        .populate('seller', 'name')
        .sort({ updatedAt: -1 })

        res.json(negotiations)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const makeOffer = async (req, res) => {
    try {
        const { amount } = req.body
        const negotiation = await Negotiation.findById(req.params.id).populate('item')

        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })
        if(negotiation.status !== 'active') return res.status(400).json({ message: 'Negotiation is not active' })

        // enforce floor
        if(amount < negotiation.item.floorPrice) {
            return res.status(400).json({
                message: `Minimum offer is KSh ${negotiation.item.floorPrice}`,
                floorPrice: negotiation.item.floorPrice
            })
        }

        const isParty = negotiation.buyer.toString() === req.user._id.toString() ||
                        negotiation.seller.toString() === req.user._id.toString()
        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        const type = negotiation.buyer.toString() === req.user._id.toString() ? 'offer' : 'counter'

        negotiation.messages.push({ sender: req.user._id, type, amount })
        negotiation.currentOffer = amount
        negotiation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await negotiation.save()

        // notify other party
        const otherId = type === 'offer' ? negotiation.seller : negotiation.buyer
        const other = await User.findById(otherId)
        await sendSMS({
            phone: other.phone,
            message: `New ${type} of KSh ${amount} on ${negotiation.item.title}. Open Haggler to respond.`
        })

        res.json(negotiation)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const acceptOffer = async (req, res) => {
    try {
        const negotiation = await Negotiation.findById(req.params.id).populate('item')
        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })
        if(negotiation.status !== 'active') return res.status(400).json({ message: 'Negotiation not active' })

        const isParty = negotiation.buyer.toString() === req.user._id.toString() ||
                        negotiation.seller.toString() === req.user._id.toString()
        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        negotiation.status = 'agreed'
        negotiation.agreedPrice = negotiation.currentOffer
        negotiation.messages.push({
            sender: req.user._id,
            type: 'accept',
            text: `Deal at KSh ${negotiation.currentOffer}`
        })
        await negotiation.save()

        // notify both parties
        const buyer = await User.findById(negotiation.buyer)
        const seller = await User.findById(negotiation.seller)

        await sendSMS({
            phone: buyer.phone,
            message: `Deal agreed at KSh ${negotiation.agreedPrice} for ${negotiation.item.title}. Proceed to payment on Haggler.`
        })
        await sendSMS({
            phone: seller.phone,
            message: `Deal agreed at KSh ${negotiation.agreedPrice} for ${negotiation.item.title}. Prepare item for pickup.`
        })

        res.json(negotiation)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const declineOffer = async (req, res) => {
    try {
        const negotiation = await Negotiation.findById(req.params.id)
        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })

        negotiation.status = 'cancelled'
        negotiation.messages.push({
            sender: req.user._id,
            type: 'decline',
            text: 'Offer declined'
        })
        await negotiation.save()

        // decrement bid count
        await Item.findByIdAndUpdate(negotiation.item, { $inc: { bidCount: -1 } })

        res.json({ message: 'Negotiation cancelled' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const sendMessage = async (req, res) => {
    try {
        const { text } = req.body
        const negotiation = await Negotiation.findById(req.params.id)
        if(!negotiation) return res.status(404).json({ message: 'Negotiation not found' })

        const isParty = negotiation.buyer.toString() === req.user._id.toString() ||
                        negotiation.seller.toString() === req.user._id.toString()
        if(!isParty) return res.status(403).json({ message: 'Not authorized' })

        negotiation.messages.push({ sender: req.user._id, type: 'message', text })
        negotiation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await negotiation.save()

        res.json(negotiation)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createNegotiation, getNegotiation, getMyNegotiations,
    makeOffer, acceptOffer, declineOffer, sendMessage
}