import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `HireFlow <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Email send error:', error);
        throw new Error('Email could not be sent');
    }
};

export default sendEmail;
  