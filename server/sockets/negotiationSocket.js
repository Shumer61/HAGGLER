const jwt = require('jsonwebtoken')
const Negotiation = require('../models/Negotiation')
const Item = require('../models/Item')

module.exports = (io) => {

    // authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token
        if(!token) return next(new Error('Authentication required'))

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
            socket.userId = decoded.id
            next()
        } catch(err) {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.userId}`)

        // join a negotiation room
        socket.on('join_negotiation', async ({ negotiationId }) => {
            try {
                const negotiation = await Negotiation.findById(negotiationId)
                if(!negotiation) return

                const isParty = negotiation.buyer.toString() === socket.userId ||
                                negotiation.seller.toString() === socket.userId

                if(!isParty) return socket.emit('error', { message: 'Not authorized' })

                socket.join(`negotiation-${negotiationId}`)
                socket.emit('joined', { negotiationId })
            } catch(err) {
                socket.emit('error', { message: 'Could not join negotiation' })
            }
        })

        // send offer via socket (real-time update)
        socket.on('send_offer', async ({ negotiationId, amount }) => {
            try {
                const negotiation = await Negotiation.findById(negotiationId)
                    .populate('item')

                if(!negotiation || negotiation.status !== 'active') return

                // enforce floor price
                if(amount < negotiation.item.floorPrice) {
                    return socket.emit('offer_rejected', {
                        message: `Minimum offer is KSh ${negotiation.item.floorPrice}`
                    })
                }

                const type = negotiation.buyer.toString() === socket.userId ? 'offer' : 'counter'

                negotiation.messages.push({ sender: socket.userId, type, amount })
                negotiation.currentOffer = amount
                negotiation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
                await negotiation.save()

                // broadcast to both parties in the room
                io.to(`negotiation-${negotiationId}`).emit('new_offer', {
                    sender: socket.userId,
                    type,
                    amount,
                    timestamp: new Date()
                })

            } catch(err) {
                socket.emit('error', { message: 'Offer failed' })
            }
        })

        // send text message
        socket.on('send_message', async ({ negotiationId, text }) => {
            try {
                const negotiation = await Negotiation.findById(negotiationId)
                if(!negotiation || negotiation.status !== 'active') return

                negotiation.messages.push({ sender: socket.userId, type: 'message', text })
                await negotiation.save()

                io.to(`negotiation-${negotiationId}`).emit('new_message', {
                    sender: socket.userId,
                    text,
                    timestamp: new Date()
                })
            } catch(err) {
                socket.emit('error', { message: 'Message failed' })
            }
        })

        // typing indicator
        socket.on('typing', ({ negotiationId }) => {
            socket.to(`negotiation-${negotiationId}`).emit('user_typing', {
                userId: socket.userId
            })
        })

        // accept offer via socket
        socket.on('accept_offer', async ({ negotiationId }) => {
            try {
                const negotiation = await Negotiation.findById(negotiationId)
                if(!negotiation || negotiation.status !== 'active') return

                negotiation.status = 'agreed'
                negotiation.agreedPrice = negotiation.currentOffer
                negotiation.messages.push({
                    sender: socket.userId,
                    type: 'accept',
                    text: `Deal at KSh ${negotiation.currentOffer}`
                })
                await negotiation.save()

                io.to(`negotiation-${negotiationId}`).emit('offer_accepted', {
                    agreedPrice: negotiation.agreedPrice,
                    negotiationId
                })
            } catch(err) {
                socket.emit('error', { message: 'Accept failed' })
            }
        })

        // decline offer via socket
        socket.on('decline_offer', async ({ negotiationId }) => {
            try {
                const negotiation = await Negotiation.findById(negotiationId)
                if(!negotiation) return

                negotiation.status = 'cancelled'
                negotiation.messages.push({
                    sender: socket.userId,
                    type: 'decline',
                    text: 'Offer declined'
                })
                await negotiation.save()

                await Item.findByIdAndUpdate(negotiation.item, { $inc: { bidCount: -1 } })

                io.to(`negotiation-${negotiationId}`).emit('offer_declined', { negotiationId })
            } catch(err) {
                socket.emit('error', { message: 'Decline failed' })
            }
        })

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.userId}`)
        })
    })
}