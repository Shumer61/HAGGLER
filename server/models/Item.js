const mongoose = require('mongoose')

const ItemSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        enum: ['tops', 'bottoms', 'dresses', 'shoes', 'jackets', 'accessories', 'other'],
        required: true
    },
    size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', 'One Size'],
        required: true
    },
    condition: {
        type: String,
        enum: ['excellent', 'good', 'fair'],
        required: true
    },
    brand: {
        type: String,
        default: 'Unknown',
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [50, 'Minimum price is KSh 50']
    },
    floorPrice: {
        type: Number
    },
    images: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        enum: ['available', 'negotiating', 'sold', 'removed'],
        default: 'available'
    },
    bidCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

ItemSchema.pre('save', function(next) {
    this.floorPrice = Math.ceil(this.price * 0.75)
    next()
})

module.exports = mongoose.model('Item', ItemSchema)