require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Create initial admin user
      const adminUser = new User({
        name: process.env.INITIAL_ADMIN_NAME || 'Admin User',
        email: process.env.INITIAL_ADMIN_EMAIL,
        password: await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 10),
        role: 'admin',
        status: 'active',
        emailVerified: true
      });

      await adminUser.save();
      console.log('Initial admin user created successfully!');
      console.log('Email:', process.env.INITIAL_ADMIN_EMAIL);
    } else {
      console.log('Admin user already exists. Skipping initialization.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
createInitialAdmin();