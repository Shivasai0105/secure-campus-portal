// Quick test script to check if certificate upload works
// Run this with: node backend/test-upload.js

const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get a student ID
        const User = require('./src/models/User');
        const student = await User.findOne({ role: 'student' });

        if (!student) {
            console.log('No student found in database. Please create a student first.');
            process.exit(1);
        }

        console.log('Found student:', student.name, '| ID:', student._id);
        console.log('\nUse this Student ID when uploading:');
        console.log(student._id.toString());

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
