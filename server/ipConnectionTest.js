const mongoose = require('mongoose');

// Construct connection string using IP addresses from SRV records
const uri = 'mongodb://ryanshuma99_db_user:Haggler2026db@159.41.95.163:27017,159.41.95.170:27017,159.41.95.185:27017/haggler?replicaSet=atlas-b9n8ge-shard-0&authSource=admin&retryWrites=true&w=majority';

console.log('Testing connection with IP-based URI:', uri.replace(/:[^:@]*@/, ':***@'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('Connected successfully via IP-based URI!');
  mongoose.connection.db.admin().ping((err, result) => {
    if (err) console.error('Ping failed:', err);
    else console.log('Ping result:', result);
    mongoose.disconnect();
  });
})
.catch(err => {
  console.error('IP-based URI connection error:', err.message);
  console.error('Error name:', err.name);
  if (err.errorLabels) console.error('Error labels:', err.errorLabels);
  process.exit(1);
});