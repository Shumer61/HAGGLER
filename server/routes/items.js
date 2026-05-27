const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { sellerOnly, approvedSellerOnly } = require('../middleware/roles')
const { uploadItemImages, handleUploadError } = require('../middleware/upload')
const {
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    getSellerItems
} = require('../controllers/itemController')

router.get('/', getItems)
router.get('/my-listings', protect, sellerOnly, getSellerItems)
router.get('/:id', getItem)
router.post('/', protect, sellerOnly, approvedSellerOnly, uploadItemImages, handleUploadError, createItem)
router.put('/:id', protect, sellerOnly, updateItem)
router.delete('/:id', protect, sellerOnly, deleteItem)

module.exports = router