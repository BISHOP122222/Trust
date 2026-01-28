import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server error:', error);
        return false;
    }
};

const commonFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center;">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} TRUST. All rights reserved.</p>
    </div>
`;

export const sendWelcomeEmail = async (email: string, name: string) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to TRUST 🎉',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Welcome ${name},</h2>
        <p style="color: #475569; font-size: 16px;">Your account has been successfully created.</p>
        <p style="color: #475569; font-size: 16px;">You can now log in and start using TRUST to manage your business efficiently.</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to TRUST</a>
        </div>
        ${commonFooter}
      </div>
    `,
    });
};

export const sendResetEmail = async (email: string, resetToken: string) => {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request - TRUST',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px;">You requested a password reset for your TRUST account.</p>
        <p style="color: #475569; font-size: 16px;">Click the button below to reset your password. This link expires in 15 minutes.</p>
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${resetURL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">${resetURL}</p>
        ${commonFooter}
      </div>
    `,
    });
};

export default transporter;
