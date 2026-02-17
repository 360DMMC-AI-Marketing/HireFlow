import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['admin', 'recruiter', 'hiring_manager'],
        default: 'recruiter'
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null
    },
    
    // --- GOOGLE CALENDAR INTEGRATION FIELDS ---
    googleId: { type: String },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String }, // Crucial for offline access
    // ------------------------------------------

    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false
    },
    companyName: {
        type: String,
        required: [true, "Please provide a company name"]
    },
    companyWebsite: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        enum: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Consulting', 'Other'],
        required: [true, "Please provide an industry"]
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        required: [true, "Please provide company size"]
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    jobTitle: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordCode: String,
    resetPasswordCodeExpires: Date,
    refreshToken: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
};

// Generate refresh token (longer lived)
UserSchema.methods.generateRefreshToken = function() {
    const refreshToken = jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'),
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    this.refreshToken = refreshToken;
    return refreshToken;
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    return verificationToken;
};

// Generate reset password token
UserSchema.methods.generateResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

// Generate 6-digit verification code for password reset
UserSchema.methods.generateResetPasswordCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetPasswordCode = crypto.createHash('sha256').update(code).digest('hex');
    this.resetPasswordCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    return code;
};

export default mongoose.models.User || mongoose.model("User", UserSchema);