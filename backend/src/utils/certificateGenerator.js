const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a Bonafide Certificate PDF
 * @param {Object} studentData - Student information
 * @param {Object} certificateData - Certificate details
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateBonafideCertificate(studentData, certificateData) {
    return new Promise((resolve, reject) => {
        try {
            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(__dirname, '../../uploads/certificates');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate unique filename
            const filename = `bonafide-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            // Create PDF document
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header - Institution Name
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .text('SECURE CAMPUS PORTAL', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(12)
                .font('Helvetica')
                .text('Institution Address Line 1', { align: 'center' })
                .text('Institution Address Line 2', { align: 'center' })
                .moveDown(2);

            // Certificate Title
            doc.fontSize(18)
                .font('Helvetica-Bold')
                .text('BONAFIDE CERTIFICATE', { align: 'center', underline: true })
                .moveDown(2);

            // Certificate Number and Date
            doc.fontSize(11)
                .font('Helvetica')
                .text(`Certificate No: ${certificateData.certificateNumber}`, { align: 'left' })
                .text(`Date: ${new Date(certificateData.issueDate).toLocaleDateString('en-IN')}`, { align: 'left' })
                .moveDown(2);

            // Certificate Body
            doc.fontSize(12)
                .font('Helvetica')
                .text('This is to certify that', { continued: true })
                .font('Helvetica-Bold')
                .text(` ${studentData.name}`, { continued: true })
                .font('Helvetica')
                .text(` bearing Roll Number`, { continued: true })
                .font('Helvetica-Bold')
                .text(` ${studentData.rollNumber || 'N/A'}`)
                .font('Helvetica')
                .text(`is a bonafide student of this institution studying in ${certificateData.course || 'the program'}`)
                .text(`for the academic year ${certificateData.academicYear || new Date().getFullYear()}.`)
                .moveDown(1.5);

            if (certificateData.purpose) {
                doc.text(`This certificate is issued for ${certificateData.purpose}.`)
                    .moveDown(1.5);
            }

            if (certificateData.validUntil) {
                doc.fontSize(10)
                    .text(`Valid Until: ${new Date(certificateData.validUntil).toLocaleDateString('en-IN')}`)
                    .moveDown(2);
            } else {
                doc.moveDown(2);
            }

            // Signature Section
            doc.moveDown(3);
            doc.fontSize(11)
                .text('_____________________', 350, doc.y)
                .text('Authorized Signatory', 350, doc.y + 5)
                .text('Principal/Director', 350, doc.y + 5);

            // Footer
            doc.fontSize(9)
                .text('This is a computer-generated certificate.', 50, doc.page.height - 50, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filepath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate a Character Certificate PDF
 */
async function generateCharacterCertificate(studentData, certificateData) {
    return new Promise((resolve, reject) => {
        try {
            const uploadsDir = path.join(__dirname, '../../uploads/certificates');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `character-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
            const filepath = path.join(uploadsDir, filename);

            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .text('SECURE CAMPUS PORTAL', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(12)
                .font('Helvetica')
                .text('Institution Address Line 1', { align: 'center' })
                .text('Institution Address Line 2', { align: 'center' })
                .moveDown(2);

            // Title
            doc.fontSize(18)
                .font('Helvetica-Bold')
                .text('CHARACTER CERTIFICATE', { align: 'center', underline: true })
                .moveDown(2);

            // Certificate Number and Date
            doc.fontSize(11)
                .font('Helvetica')
                .text(`Certificate No: ${certificateData.certificateNumber}`, { align: 'left' })
                .text(`Date: ${new Date(certificateData.issueDate).toLocaleDateString('en-IN')}`, { align: 'left' })
                .moveDown(2);

            // Body
            doc.fontSize(12)
                .font('Helvetica')
                .text('This is to certify that', { continued: true })
                .font('Helvetica-Bold')
                .text(` ${studentData.name}`, { continued: true })
                .font('Helvetica')
                .text(` bearing Roll Number`, { continued: true })
                .font('Helvetica-Bold')
                .text(` ${studentData.rollNumber || 'N/A'}`)
                .font('Helvetica')
                .text(`was a student of this institution from ${certificateData.academicYear || 'the academic year'}.`)
                .moveDown(1.5)
                .text('During their tenure, they have maintained good character and conduct.')
                .text('We wish them success in all their future endeavors.')
                .moveDown(3);

            // Signature
            doc.fontSize(11)
                .text('_____________________', 350, doc.y)
                .text('Authorized Signatory', 350, doc.y + 5)
                .text('Principal/Director', 350, doc.y + 5);

            // Footer
            doc.fontSize(9)
                .text('This is a computer-generated certificate.', 50, doc.page.height - 50, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(filepath));
            stream.on('error', (error) => reject(error));

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate certificate based on type
 */
async function generateCertificate(studentData, certificateData) {
    const { type } = certificateData;

    switch (type) {
        case 'bonafide':
            return await generateBonafideCertificate(studentData, certificateData);
        case 'character':
            return await generateCharacterCertificate(studentData, certificateData);
        case 'transfer':
        case 'course_completion':
            // For now, use bonafide template (can be customized later)
            return await generateBonafideCertificate(studentData, certificateData);
        default:
            throw new Error('Invalid certificate type');
    }
}

module.exports = {
    generateCertificate,
    generateBonafideCertificate,
    generateCharacterCertificate
};
