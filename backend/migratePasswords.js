/**
 * One-time script: hash any plain-text passwords already in the DB.
 * Run once with:  node migratePasswords.js
 * Safe to run multiple times — skips already-hashed passwords.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.DB_NAME || "clouddb";

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log("Connected to MongoDB");

  const User = require("./models/User");

  // Load all users including the password field
  const users = await User.find().select("+password");
  console.log(`Found ${users.length} user(s)`);

  let migrated = 0;
  for (const user of users) {
    // bcrypt hashes always start with $2b$ or $2a$
    if (user.password && user.password.startsWith("$2")) {
      console.log(`  SKIP  ${user.email} (already hashed)`);
      continue;
    }
    const plain = user.password;
    user.password = await bcrypt.hash(plain, 10);
    // Use updateOne to bypass the pre-save hook (already hashing manually)
    await User.updateOne({ _id: user._id }, { $set: { password: user.password } });
    console.log(`  HASHED ${user.email}`);
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated} password(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
