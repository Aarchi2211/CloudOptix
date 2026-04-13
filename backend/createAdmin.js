const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.DB_NAME || 'clouddb';

const adminEmail = 'admin@example.com';
const adminPassword = 'Admin1234';
const adminName = 'Administrator';

async function createAdmin() {
  await mongoose.connect(mongoUri, { dbName: databaseName });

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    existingAdmin.password = adminPassword;
    existingAdmin.role = 'Admin';
    existingAdmin.name = adminName;
    await existingAdmin.save();
    console.log(`Updated existing admin account: ${adminEmail}`);
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'Admin',
    });
    console.log(`Created new admin account: ${adminEmail}`);
  }

  console.log('Admin credentials:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('Failed to create admin account:', error);
  process.exit(1);
});
