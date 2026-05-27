const { upload } = require('../config/cloudinary'); // Import the configured upload

const uploadItemImages = upload.array('images', 5);

const handleUploadError = (err, req, res, next) => {
    if(err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

module.exports = { uploadItemImages, handleUploadError };