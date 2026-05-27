const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { platformAdminOnly } = require('../middleware/roles')
const {
    getPendingSellers,
    approveSeller,
    rejectSeller,
    getAllTransactions,
    resolveDispute,
    removeItem,
    suspendUser,
    getDashboardStats
} = require('../controllers/adminController')

router.use(protect, platformAdminOnly)

router.get('/dashboard', getDashboardStats)
router.get('/sellers/pending', getPendingSellers)
router.put('/sellers/:id/approve', approveSeller)
router.put('/sellers/:id/reject', rejectSeller)
router.get('/transactions', getAllTransactions)
router.put('/disputes/:id/resolve', resolveDispute)
router.delete('/items/:id', removeItem)
router.put('/users/:id/suspend', suspendUser)

module.exports = router