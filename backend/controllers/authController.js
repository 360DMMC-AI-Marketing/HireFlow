import User from "../models/user.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { email, password, companyName, industry, companySize } = req.body;

    if (!email || !password || !companyName || !industry || !companySize) {
      return res.status(400).json({ error: "Please provide all fields" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = new User({
      email,
      password,
      companyName,
      industry,
      companySize,
    });

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const message = `Please verify your email by clicking this link: ${verifyUrl}`;
    
    // Try to send email, but don't fail if email service is not configured
    try {
      await sendEmail(user.email, "Verify Your Email", message);
      console.log('✅ Verification email sent to:', user.email);
    } catch (emailError) {
      console.log('❌ Email service not working, but signup successful!');
      console.log('📧 Copy this token to verify your account:');
      console.log('🔑 Token:', verificationToken);
      console.log('🔗 Or visit:', verifyUrl);
    }

    res.status(200).json({ 
      success: true,
      message: "Account created! Check your email or backend console for verification token.",
      // Include token in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { 
        verificationToken,
        verificationUrl: verifyUrl 
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Invalid or missing token" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: "Email verified successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ error: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = user.getSignedJwtToken();
    const refreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        department: user.department,
        bio: user.bio,
        avatar: user.avatar,
        companyName: user.companyName,
        companyWebsite: user.companyWebsite,
        companySize: user.companySize,
        industry: user.industry
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// FORGOT PASSWORD - Send verification code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        success: true,
        message: "If that email exists, a verification code has been sent" 
      });
    }

    const verificationCode = user.generateResetPasswordCode();
    await user.save();

    const textMessage = `Your password reset verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #061446; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            You requested to reset your password. Use the verification code below to proceed:
          </p>
          <div style="background-color: #f1f5f9; padding: 24px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
              Verification Code
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #061446; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${verificationCode}
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This code will expire in <strong>15 minutes</strong>.
          </p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
            If you didn't request this password reset, please ignore this email or contact support if you're concerned.
          </p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} HireFlow. All rights reserved.
        </p>
      </div>
    `;

    const emailResult = await sendEmail(user.email, "Password Reset Code - HireFlow", textMessage, htmlMessage);

    res.status(200).json({ 
      success: true,
      message: "Verification code sent to your email",
      emailSent: emailResult.success
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// VERIFY RESET CODE
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordCode: hashedCode,
      resetPasswordCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    // Generate a temporary token for password reset
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    res.status(200).json({ 
      success: true,
      message: "Code verified successfully",
      resetToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Please provide a new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: "Password reset successful" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET ME (protected route)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        department: user.department,
        bio: user.bio,
        avatar: user.avatar,
        companyName: user.companyName,
        companyWebsite: user.companyWebsite,
        companySize: user.companySize,
        industry: user.industry,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }
  } catch (err) {
    // Ignore errors during logout cleanup
  }
  res.status(200).json({ 
    success: true,
    message: "Logout successful" 
  });
};

// REFRESH TOKEN - Issue new access token using refresh token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh')
      );
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Find user and verify stored refresh token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Issue new access token
    const newAccessToken = user.getSignedJwtToken();

    // Optionally rotate refresh token
    const newRefreshToken = user.generateRefreshToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: "Server error" });
  }
};
