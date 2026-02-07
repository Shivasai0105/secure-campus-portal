// Test script to create a faculty user and test login
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function createTestFaculty() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if faculty user already exists
        const existing = await User.findOne({ email: 'faculty@test.com' });
        if (existing) {
            console.log('Faculty user already exists:', existing.email, 'Role:', existing.role);
            await mongoose.connection.close();
            return;
        }

        // Create test faculty user
        const passwordHash = await bcrypt.hash('password123', 12);
        const faculty = await User.create({
            name: 'Test Faculty',
            email: 'faculty@test.com',
            password: passwordHash,
            role: 'faculty',
            employeeId: 'FAC001',
            designation: 'professor',
            department: 'cse',
            phone: '1234567890'
        });

        console.log('✅ Test faculty user created successfully!');
        console.log('Email:', faculty.email);
        console.log('Password: password123');
        console.log('Role:', faculty.role);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        await mongoose.connection.close();
    }
}

createTestFaculty();
