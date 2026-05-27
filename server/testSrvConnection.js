require('dotenv').config();
const mongoose = require('mongoose');

// Extract credentials from the original URI or use hardcoded for testing
const username = 'ryanshuma99_db_user';
const password = 'Haggler2026db';
const cluster = 'cluster61.pwrdefm.mongodb.net'; // Guessed cluster host
const dbName = 'haggler';

const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?authSource=admin&retryWrites=true&w=majority`;

console.log('Testing connection with URI:', uri.replace(/:[^:@]*@/, ':***@'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
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
  
  if (err.reason) {
    console.error('Error reason:', err.reason);
  }
  if (err.code) {
    console.error('Error code:', err.code);
  }
  
  process.exit(1);
});