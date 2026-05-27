const Item = require('../models/Item')

const getItems = async (req, res) => {
    try {
        const { category, size, condition, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query

        const query = { status: 'available', isActive: true }

        if(category) query.category = category
        if(size) query.size = size
        if(condition) query.condition = condition
        if(minPrice || maxPrice) {
            query.price = {}
            if(minPrice) query.price.$gte = Number(minPrice)
            if(maxPrice) query.price.$lte = Number(maxPrice)
        }
        if(search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]
        }

        const skip = (Number(page) - 1) * Number(limit)
        const total = await Item.countDocuments(query)
        const items = await Item.find(query)
            .populate('seller', 'name sellerProfile.storeName rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))

        res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('seller', 'name phone sellerProfile rating')

        if(!item || !item.isActive) {
            return res.status(404).json({ message: 'Item not found' })
        }

        item.views += 1
        await item.save()

        res.json(item)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const createItem = async (req, res) => {
    try {
        const { title, description, category, size, condition, brand, price } = req.body

        if(!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' })
        }

        const images = req.files.map(f => f.path)

        const item = await Item.create({
            seller: req.user._id,
            title,
            description,
            category,
            size,
            condition,
            brand,
            price: Number(price),
            images
        })

        res.status(201).json(item)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
        if(!item) return res.status(404).json({ message: 'Item not found' })

        if(item.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your listing' })
        }

        const { title, description, category, size, condition, brand, price } = req.body
        if(title) item.title = title
        if(description) item.description = description
        if(category) item.category = category
        if(size) item.size = size
        if(condition) item.condition = condition
        if(brand) item.brand = brand
        if(price) item.price = Number(price)

        await item.save()
        res.json(item)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
        if(!item) return res.status(404).json({ message: 'Item not found' })

        if(item.seller.toString() !== req.user._id.toString() && req.user.role !== 'platform_admin') {
            return res.status(403).json({ message: 'Not your listing' })
        }

        item.isActive = false
        item.status = 'removed'
        await item.save()

        res.json({ message: 'Item removed' })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

const getSellerItems = async (req, res) => {
    try {
        const items = await Item.find({ seller: req.user._id, isActive: true })
            .sort({ createdAt: -1 })
        res.json(items)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, getSellerItems }