const cloudinary = require('cloudinary').v2
const cloudinaryStorage = require('multer-storage-cloudinary'); // Returns a factory function
const multer = require('multer')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = cloudinaryStorage({
    cloudinary: cloudinary,  // Note: use cloudinary: cloudinary, not just cloudinary
    params: {
        folder: 'haggler/items',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
    }
})

const upload = multer({
    storage: storage,  // Note: use storage: storage
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if(file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Images only'), false)
        }
    }
})

module.exports = { cloudinary, upload }