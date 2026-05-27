const mongoose = require('mongoose');
const dns = require('dns');

// Explicitly set DNS servers to Google's public DNS to bypass local DNS issues
// This must be done before any DNS resolution occurs
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch(error) {
        console.error(`DB Error: ${error.message}`);
        // Additional debugging info
        if (error.errorLabels) {
            console.error('Error labels:', error.errorLabels);
        }
        if (error.reason) {
            console.error('Error reason:', error.reason);
        }
        process.exit(1);
    }
};

module.exports = connectDB;