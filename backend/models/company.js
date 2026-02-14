import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a company name"],
        trim: true
    },
    website: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        enum: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Consulting', 'Other'],
        required: [true, "Please provide an industry"]
    },
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
        required: [true, "Please provide company size"]
    },
    description: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    branding: {
        primaryColor: { type: String, default: '#6366f1' },
        secondaryColor: { type: String, default: '#818cf8' }
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        facebook: { type: String, default: '' }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'recruiter', 'hiring_manager'],
            default: 'recruiter'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast lookups
CompanySchema.index({ owner: 1 });
CompanySchema.index({ 'members.user': 1 });

export default mongoose.models.Company || mongoose.model("Company", CompanySchema);
