import User from '../models/user.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ 
            success: true, 
            user: {
                id: user._id,
                email: user.email,
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
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, jobTitle, department, bio, avatar, company } = req.body;
        
        // Find user and update fields
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update profile fields if provided
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (jobTitle !== undefined) user.jobTitle = jobTitle;
        if (department !== undefined) user.department = department;
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;
        
        // Update company fields if provided
        if (company) {
            if (company.name !== undefined) user.companyName = company.name;
            if (company.website !== undefined) user.companyWebsite = company.website;
            if (company.size !== undefined) user.companySize = company.size;
            if (company.industry !== undefined) user.industry = company.industry;
        }
        
        await user.save();
        
        // Return updated user (exclude password)
        const updatedUser = {
            id: user._id,
            email: user.email,
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
            company: {
                name: user.companyName,
                website: user.companyWebsite,
                size: user.companySize,
                industry: user.industry
            }
        };
        
        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }
};
