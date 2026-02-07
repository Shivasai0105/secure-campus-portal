// Test script to check if student has any certificates
// Run: node backend/check-certificates.js

const mongoose = require('mongoose');
require('dotenv').config();

async function checkCertificates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const Certificate = require('./src/models/Certificate');
        const BonafideRequest = require('./src/models/BonafideRequest');
        const User = require('./src/models/User');

        // Find all students
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} student(s)\n`);

        for (const student of students) {
            console.log('═'.repeat(80));
            console.log(`Student: ${student.name} (${student.email})`);
            console.log('─'.repeat(80));

            // Check bonafide requests
            const requests = await BonafideRequest.find({ studentId: student._id })
                .populate('certificateId')
                .sort({ createdAt: -1 });

            console.log(`\nBonafide Requests: ${requests.length}`);
            requests.forEach((req, i) => {
                console.log(`  ${i + 1}. Status: ${req.status} | Reason: ${req.reason}`);
                if (req.certificateId) {
                    console.log(`     ✅ Certificate: ${req.certificateId.certificateNumber}`);
                    console.log(`     📄 File: ${req.certificateId.fileUrl}`);
                } else if (req.status === 'approved') {
                    console.log(`     ⚠️  Approved but NO certificate generated!`);
                }
            });

            // Check certificates directly
            const certificates = await Certificate.find({ studentId: student._id });
            console.log(`\nCertificates: ${certificates.length}`);
            certificates.forEach((cert, i) => {
                console.log(`  ${i + 1}. ${cert.type} - ${cert.certificateNumber}`);
                console.log(`     File: ${cert.fileUrl}`);
                console.log(`     Status: ${cert.status}`);
            });

            console.log('\n');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCertificates();
