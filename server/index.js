require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const xss        = require('xss-clean')
const http       = require('http')
const { Server } = require('socket.io')
const connectDB  = require('./config/db')
const { globalLimit, authLimit } = require('./middleware/security')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
})

connectDB()

// Security middleware
app.use(helmet())
app.use(mongoSanitize())
app.use(xss())
app.use(globalLimit)

// Core middleware
app.use(cors({
    origin: [process.env.CLIENT_URL, /\.vercel\.app$/],
    credentials: true
}))
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))

console.log('authLimit type:', typeof authLimit)
console.log('authLimit:', authLimit)

// Routes
const authRoutes         = require('./routes/auth')
const itemRoutes         = require('./routes/items')
const negotiationRoutes  = require('./routes/negotiations')
const paymentRoutes      = require('./routes/payments')
const adminRoutes        = require('./routes/admin')

app.use('/auth',         authLimit, authRoutes)
app.use('/items',        itemRoutes)
app.use('/negotiations', negotiationRoutes)
app.use('/payments',     paymentRoutes)
app.use('/admin',        adminRoutes)

app.get('/', (req, res) => {
    res.json({ message: 'Haggler API is running' })
})

// Socket.io
require('./sockets/negotiationSocket')(io)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = { io }