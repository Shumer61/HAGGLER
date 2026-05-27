const mongoose = require('mongoose');

// Using one of the IPs we resolved earlier
const uri = 'mongodb://159.41.95.163:27017/haggler?authSource=admin&retryWrites=true&w=majority&username=ryanshuma99_db_user&password=Haggler2026db';

console.log('Testing direct IP connection:', uri.replace(/:[^:@]*@/, ':***@'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('Connected successfully via direct IP!');
  mongoose.connection.db.admin().ping((err, result) => {
    if (err) console.error('Ping failed:', err);
    else console.log('Ping result:', result);
    mongoose.disconnect();
  });
})
.catch(err => {
  console.error('Direct IP connection error:', err.message);
  console.error('Error name:', err.name);
  if (err.errorLabels) console.error('Error labels:', err.errorLabels);
  process.exit(1);
});