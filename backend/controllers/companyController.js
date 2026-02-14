import Company from '../models/company.js';
import User from '../models/user.js';

// @desc    Get current user's company
// @route   GET /api/company
export const getCompany = async (req, res) => {
    try {
        // Find company where user is owner or member
        let company = await Company.findOne({
            $or: [
                { owner: req.user.id },
                { 'members.user': req.user.id }
            ]
        }).populate('owner', 'firstName lastName email avatar')
          .populate('members.user', 'firstName lastName email avatar jobTitle');

        if (!company) {
            // Auto-create company from user's legacy data
            const user = await User.findById(req.user.id);
            if (user && user.companyName) {
                company = await Company.create({
                    name: user.companyName,
                    website: user.companyWebsite || '',
                    industry: user.industry,
                    size: user.companySize,
                    owner: user._id,
                    members: [{ user: user._id, role: user.role || 'admin' }]
                });
                user.companyId = company._id;
                await user.save({ validateBeforeSave: false });
                company = await Company.findById(company._id)
                    .populate('owner', 'firstName lastName email avatar')
                    .populate('members.user', 'firstName lastName email avatar jobTitle');
            }
        }

        if (!company) {
            return res.status(404).json({ success: false, error: 'No company found' });
        }

        res.json({ success: true, company });
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Create a new company
// @route   POST /api/company
export const createCompany = async (req, res) => {
    try {
        // Check if user already has a company
        const existing = await Company.findOne({
            $or: [
                { owner: req.user.id },
                { 'members.user': req.user.id }
            ]
        });
        if (existing) {
            return res.status(400).json({ success: false, error: 'You already belong to a company' });
        }

        const { name, website, industry, size, description } = req.body;


        const company = await Company.create({
            name,
            website: website || '',
            industry,
            size,
            description: description || '',
            owner: req.user.id,
            members: [{ user: req.user.id, role: 'admin' }]
        });

        // Link user to company
        await User.findByIdAndUpdate(req.user.id, { companyId: company._id });

        res.status(201).json({ success: true, company });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};

// @desc    Update company
// @route   PUT /api/company
export const updateCompany = async (req, res) => {
    try {
        let company = await Company.findOne({
            $or: [
                { owner: req.user.id },
                { 'members.user': req.user.id }
            ]
        });

        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found' });
        }

        // Only owner or admin can update
        const isOwner = company.owner.toString() === req.user.id;
        const memberEntry = company.members.find(m => m.user.toString() === req.user.id);
        if (!isOwner && (!memberEntry || memberEntry.role !== 'admin')) {
            return res.status(403).json({ success: false, error: 'Not authorized to update company' });
        }

        const allowedFields = ['name', 'website', 'industry', 'size', 'description', 'logo', 'address', 'branding', 'socialLinks'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                company[field] = req.body[field];
            }
        });

        await company.save();

        // Sync legacy fields on user
        const user = await User.findById(req.user.id);
        if (user) {
            user.companyName = company.name;
            user.companyWebsite = company.website;
            user.industry = company.industry;
            user.companySize = company.size;
            await user.save({ validateBeforeSave: false });
        }

        company = await Company.findById(company._id)
            .populate('owner', 'firstName lastName email avatar')
            .populate('members.user', 'firstName lastName email avatar jobTitle');

        res.json({ success: true, company });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};

// @desc    Add member to company
// @route   POST /api/company/members
export const addMember = async (req, res) => {
    try {
        const { email, role } = req.body;

        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found or not authorized' });
        }

        const userToAdd = await User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            return res.status(404).json({ success: false, error: 'User not found with that email' });
        }

        // Check if already a member
        const alreadyMember = company.members.some(m => m.user.toString() === userToAdd._id.toString());
        if (alreadyMember) {
            return res.status(400).json({ success: false, error: 'User is already a member' });
        }

        company.members.push({
            user: userToAdd._id,
            role: role || 'recruiter'
        });
        await company.save();

        // Link user to company
        userToAdd.companyId = company._id;
        await userToAdd.save({ validateBeforeSave: false });

        const updated = await Company.findById(company._id)
            .populate('owner', 'firstName lastName email avatar')
            .populate('members.user', 'firstName lastName email avatar jobTitle');

        res.json({ success: true, company: updated });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Remove member from company
// @route   DELETE /api/company/members/:userId
export const removeMember = async (req, res) => {
    try {
        const company = await Company.findOne({ owner: req.user.id });
        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found or not authorized' });
        }

        if (req.params.userId === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot remove yourself (owner)' });
        }

        company.members = company.members.filter(m => m.user.toString() !== req.params.userId);
        await company.save();

        // Unlink user from company
        await User.findByIdAndUpdate(req.params.userId, { companyId: null });

        const updated = await Company.findById(company._id)
            .populate('owner', 'firstName lastName email avatar')
            .populate('members.user', 'firstName lastName email avatar jobTitle');

        res.json({ success: true, company: updated });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
