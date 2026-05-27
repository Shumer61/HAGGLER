const sellerOnly = (req, res, next) => {
    if(req.user.role !== 'seller' && req.user.role !== 'platform_admin') {
        return res.status(403).json({ message: 'Seller access required' })
    }
    next()
}

const platformAdminOnly = (req, res, next) => {
    if(req.user.role !== 'platform_admin') {
        return res.status(403).json({ message: 'Admin access required' })
    }
    next()
}

const approvedSellerOnly = (req, res, next) => {
    if(req.user.role === 'seller' && req.user.sellerStatus !== 'approved') {
        return res.status(403).json({ message: 'Seller account pending approval' })
    }
    next()
}

module.exports = { sellerOnly, platformAdminOnly, approvedSellerOnly }