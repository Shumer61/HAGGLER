require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

console.log('MONGODB_URI from env:', uri ? uri.replace(/:[^:@]*@/, ':***@') : 'undefined');

if (!uri) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000, // Increase timeout
})
.then(() => {
  console.log('Connected successfully!');
  mongoose.connection.db.admin().ping((err, result) => {
    if (err) console.error('Ping failed:', err);
    else console.log('Ping result:', result);
    mongoose.disconnect();
  });
})
.catch(err => {
  console.error('Connection error:', err.message);
  console.error('Error name:', err.name);
  if (err.errorLabels) console.error('Error labels:', err.errorLabels);
  
  // Additional debugging info
  if (err.reason) {
    console.error('Error reason:', err.reason);
  }
  if (err.code) {
    console.error('Error code:', err.code);
  }
  
  process.exit(1);
});