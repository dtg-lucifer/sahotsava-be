/**
 * Email Utility
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Handles email sending with nodemailer and HTML templates
 */

import nodemailer from "nodemailer";
import { log } from "../middlewares";

interface EmailConfig {
    user: string;
    pass: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    private emailConfig: EmailConfig;

    constructor() {
        this.emailConfig = {
            user: Bun.env.EMAIL || "",
            pass: Bun.env.APP_PASSWORD || "",
        };

        if (!this.emailConfig.user || !this.emailConfig.pass) {
            log.warn(
                "⚠️  EMAIL or APP_PASSWORD not configured. Email sending will not work.",
            );
        }

        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.emailConfig.user,
                pass: this.emailConfig.pass,
            },
        });
    }

    /**
     * Generate HTML for verification email
     */
    private getVerificationEmailHTML(
        userName: string,
        verificationLink: string,
    ): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .message {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
        }
        .link-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            word-break: break-all;
        }
        .link-section p {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
        }
        .link-section a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification Required</h1>
        </div>
        <div class="content">
            <p class="greeting">Hello <strong>${userName}</strong>,</p>
            <p class="message">
                Welcome to Sahotsava! To complete your registration and access the platform,
                please verify your email address by clicking the button below.
            </p>
            <center>
                <a href="${verificationLink}" class="cta-button">Verify Email Address</a>
            </center>
            <p class="message">
                Or copy and paste this link in your browser:
            </p>
            <div class="link-section">
                <p><a href="${verificationLink}">${verificationLink}</a></p>
            </div>
            <p class="message">
                This link will expire in 24 hours for security reasons.
            </p>
            <p class="message">
                If you didn't create this account, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Sahotsava. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
		`;
    }

    /**
     * Generate HTML for already verified page
     */
    static getAlreadyVerifiedHTML(userName: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Already Verified</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .message {
            color: #666;
            font-size: 16px;
            margin: 15px 0;
            line-height: 1.6;
        }
        .info {
            background-color: #f0f4ff;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #667eea;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Already Verified</h1>
        <p class="message">
            Hello <strong>${userName}</strong>, your email is already verified!
        </p>
        <div class="info">
            Your account is active and you can use all features of Sahotsava.
        </div>
        <p class="message">
            If you need assistance, please contact our support team.
        </p>
    </div>
</body>
</html>
		`;
    }

    /**
     * Generate HTML for verification success page
     */
    static getVerificationSuccessHTML(userName: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified Successfully</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            width: 90%;
            animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .icon {
            font-size: 70px;
            margin-bottom: 20px;
            animation: checkmark 0.8s ease-out;
        }
        @keyframes checkmark {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        h1 {
            color: #28a745;
            margin: 0 0 10px 0;
            font-size: 32px;
        }
        .message {
            color: #666;
            font-size: 16px;
            margin: 15px 0;
            line-height: 1.6;
        }
        .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #155724;
            font-size: 14px;
        }
        .next-steps {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: left;
        }
        .next-steps h3 {
            color: #333;
            margin-top: 0;
            font-size: 16px;
        }
        .next-steps ol {
            color: #666;
            font-size: 14px;
            margin: 10px 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">✅</div>
        <h1>Email Verified!</h1>
        <p class="message">
            Congratulations <strong>${userName}</strong>!
        </p>
        <div class="success-box">
            Your email has been successfully verified. Your account is now active.
        </div>
        <div class="next-steps">
            <h3>What's Next?</h3>
            <ol>
                <li>Log in to your account</li>
                <li>Complete your profile information</li>
                <li>Start exploring Sahotsava</li>
            </ol>
        </div>
        <p class="message">
            Thank you for joining us. We're excited to have you on board!
        </p>
    </div>
</body>
</html>
		`;
    }

    /**
     * Generate HTML for invalid/expired verification link
     */
    static getVerificationExpiredHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Link Invalid</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc3545;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .message {
            color: #666;
            font-size: 16px;
            margin: 15px 0;
            line-height: 1.6;
        }
        .error-box {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #721c24;
            font-size: 14px;
        }
        .help-text {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            color: #004085;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>Verification Link Invalid</h1>
        <div class="error-box">
            The verification link is invalid or has expired.
        </div>
        <p class="message">
            Verification links are only valid for 24 hours.
        </p>
        <div class="help-text">
            <strong>Need help?</strong> Please request a new verification email from the login page or contact our support team.
        </div>
    </div>
</body>
</html>
		`;
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(
        userEmail: string,
        userName: string,
        verificationLink: string,
    ): Promise<boolean> {
        try {
            const htmlContent = this.getVerificationEmailHTML(
                userName,
                verificationLink,
            );

            const mailOptions = {
                from: `"Sahotsava" <${this.emailConfig.user}>`,
                to: userEmail,
                subject: "Verify Your Email Address - Sahotsava",
                html: htmlContent,
            };

            const info = await this.transporter.sendMail(mailOptions);
            log.info(`✓ Verification email sent to ${userEmail}`, {
                messageId: info.messageId,
            });
            return true;
        } catch (error) {
            log.error(`✗ Failed to send verification email to ${userEmail}`, {
                error,
            });
            return false;
        }
    }

    /**
     * Verify transporter connection
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            log.info("✓ Email service connected successfully");
            return true;
        } catch (error) {
            log.error("✗ Email service connection failed", { error });
            return false;
        }
    }
}

export const emailService = new EmailService();
