import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text, html) => {
    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Email not configured - skipping email send');
        console.log('   Would have sent:', { to, subject, text });
        return { success: false, reason: 'not_configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || `HireFlow <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            ...(html && { html })
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', to);
        return { success: true };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
};

export default sendEmail;
  