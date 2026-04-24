const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendVerificationEmail = async (email, token) => {
    const url = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    await transporter.sendMail({
        from: `"Security Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Account - Enterprise Task Manager",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h3 style="color: #2196F3;">Welcome to Version 2!</h3>
                <p>Thank you for joining our workspace. Please click the button below to verify your account and get started:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="font-size: 0.8rem; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 0.8rem; color: #2196F3;">${url}</p>
            </div>
        `,
    });
};

exports.sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        from: `"Security Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
            <h1>Reset Your Password</h1>
            <p>You requested a password reset. Click the button below to proceed. This link expires in 15 minutes.</p>
            <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `
    };

    return await transporter.sendMail(mailOptions);
};

exports.sendTaskNotificationEmail = async (email, subject, message, taskTitle) => {
    try {
        const url = `${process.env.FRONTEND_URL}/dashboard`; 
        await transporter.sendMail({
            from: `"Enterprise Task Manager" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h3 style="color: #2196F3;">${subject}</h3>
                    <p>${message}</p>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                        <strong>Task:</strong> ${taskTitle}
                    </div>
                    <a href="${url}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
                </div>
            `,
        });
    } catch (error) {
        console.error("Email notification failed:", error);
    }
};