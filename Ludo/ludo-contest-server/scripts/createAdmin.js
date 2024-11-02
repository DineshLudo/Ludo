require('dotenv').config(); // Load environment variables

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path as necessary

async function createAdmin() {
  try {
    // Use the same MongoDB URI as in app.js
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Ludo';

    // Connect to the MongoDB database
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    // Define admin credentials
    const username = 'admin';
    const password = 'admin'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const adminUser = new User({
      username,
      password: hashedPassword,
      role: 'admin',
      isAdmin: true
    });

    // Save the admin user to the database
    await adminUser.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
