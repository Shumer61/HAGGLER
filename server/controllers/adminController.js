const User = require('../models/User')
const Item = require('../models/Item')
const Transaction = require('../models/Transaction')
const Negotiation = require('../models/Negotiation')
const sendSMS = require('../utils/sendSMS')

const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalItems, totalTransactions, pendingSellers, disputes] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments({ isActive: true }),
            Transaction.countDocuments(),
            User.countDocuments({ sellerStatus: 'pending' }),
            Transaction.countDocuments({ status: 'disputed' })
        ])

        const revenue = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])

        res.json({
            totalUsers,
            totalItems,
            totalTransactions,
            pendingSellers,
            disputes,
            totalRevenue: revenue[0]?.total || 0
        })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getPendingSellers = async (req, res) => {
    try {
        const sellers = await User.find({ sellerStatus: 'pending' })
            .select('name email phone sellerProfile createdAt')
        res.json(sellers)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const approveSeller = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) return res.status(404).json({ message: 'User not found' })

        user.role = 'seller'
        user.sellerStatus = 'approved'
        user.sellerProfile.approvedAt = new Date()
        user.sellerProfile.approvedBy = req.user._id
        await user.save({ validateBeforeSave: false })

        await sendSMS({
            phone: user.phone,
            message: `Congratulations ${user.name}! Your seller account on Haggler has been approved. You can now list items.`
        })

        res.json({ message: 'Seller approved' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const rejectSeller = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) return res.status(404).json({ message: 'User not found' })

        user.sellerStatus = 'none'
        await user.save({ validateBeforeSave: false })

        await sendSMS({
            phone: user.phone,
            message: `Your seller application on Haggler was not approved at this time. Contact support for more information.`
        })

        res.json({ message: 'Application rejected' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getAllTransactions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query
        const query = status ? { status } : {}
        const skip = (Number(page) - 1) * Number(limit)

        const transactions = await Transaction.find(query)
            .populate('item', 'title')
            .populate('buyer', 'name phone')
            .populate('seller', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))

        const total = await Transaction.countDocuments(query)
        res.json({ transactions, total })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const resolveDispute = async (req, res) => {
    try {
        const { resolution, refund } = req.body
        const transaction = await Transaction.findById(req.params.id)
            .populate('buyer')
            .populate('seller')

        if(!transaction) return res.status(404).json({ message: 'Transaction not found' })

        transaction.status = refund ? 'refunded' : 'completed'
        transaction.resolvedBy = req.user._id
        await transaction.save()

        await sendSMS({
            phone: transaction.buyer.phone,
            message: `Your dispute has been resolved. ${resolution}`
        })
        await sendSMS({
            phone: transaction.seller.phone,
            message: `A dispute on your transaction has been resolved. ${resolution}`
        })

        res.json({ message: 'Dispute resolved' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const removeItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
        if(!item) return res.status(404).json({ message: 'Item not found' })

        item.isActive = false
        item.status = 'removed'
        await item.save()

        res.json({ message: 'Item removed by admin' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const suspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) return res.status(404).json({ message: 'User not found' })

        user.isActive = false
        if(user.role === 'seller') user.sellerStatus = 'suspended'
        await user.save({ validateBeforeSave: false })

        res.json({ message: 'User suspended' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getDashboardStats, getPendingSellers, approveSeller,
    rejectSeller, getAllTransactions, resolveDispute,
    removeItem, suspendUser
}