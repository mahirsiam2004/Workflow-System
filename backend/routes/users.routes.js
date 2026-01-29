const express = require('express');
const router = express.Router();

module.exports = (userModel, authMiddleware, roleCheck) => {
    // Get all users (Admin only)
    router.get('/', authMiddleware, roleCheck('admin'), async (req, res) => {
        try {
            const users = await userModel.getAllUsers();
            res.json({ users });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                error: 'Failed to get users'
            });
        }
    });

    // Get user by ID
    router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await userModel.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json({ user });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Failed to get user'
            });
        }
    });

    // Update user role (Admin only)
    router.patch('/:id/role', authMiddleware, roleCheck('admin'), async (req, res) => {
        try {
            const { role } = req.body;

            if (!role) {
                return res.status(400).json({
                    error: 'Role is required'
                });
            }

            const success = await userModel.updateRole(req.params.id, role);

            if (!success) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const updatedUser = await userModel.findById(req.params.id);

            res.json({
                message: 'Role updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({
                error: error.message || 'Failed to update role'
            });
        }
    });

    // Update user profile (Own profile or Problem Solver)
    router.patch('/:id/profile', authMiddleware, async (req, res) => {
        try {
            // Users can only update their own profile
            if (req.user._id.toString() !== req.params.id) {
                return res.status(403).json({
                    error: 'You can only update your own profile'
                });
            }

            const { bio, skills, portfolio } = req.body;

            const success = await userModel.updateProfile(req.params.id, {
                bio,
                skills,
                portfolio
            });

            if (!success) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const updatedUser = await userModel.findById(req.params.id);

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: 'Failed to update profile'
            });
        }
    });

    return router;
};
