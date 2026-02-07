// List all students with their IDs
// Run this with: node backend/list-students.js

const mongoose = require('mongoose');
require('dotenv').config();

async function listStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const User = require('./src/models/User');
        const students = await User.find({ role: 'student' }).select('_id name email rollNumber');

        if (students.length === 0) {
            console.log('No students found in database.');
            process.exit(1);
        }

        console.log(`Found ${students.length} student(s):\n`);
        console.log('═'.repeat(80));

        students.forEach((student, index) => {
            console.log(`\n${index + 1}. ${student.name}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   Roll Number: ${student.rollNumber || 'N/A'}`);
            console.log(`   Student ID: ${student._id.toString()}`);
            console.log('─'.repeat(80));
        });

        console.log('\n💡 TIP: Copy any Student ID above to use when uploading certificates/receipts\n');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

listStudents();
