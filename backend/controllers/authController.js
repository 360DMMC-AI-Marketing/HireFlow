import User from "../models/User.js";
import crypto from "crypto";
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

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        companyName: user.companyName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "No user with that email" });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please click this link to reset your password: ${resetUrl}`;

    await sendEmail(user.email, "Password Reset Request", message);

    res.status(200).json({ 
      success: true,
      message: "Password reset email sent" 
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
        companyName: user.companyName,
        industry: user.industry,
        companySize: user.companySize,
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
  res.status(200).json({ 
    success: true,
    message: "Logout successful" 
  });
};
