const express = require('express');
const router = express.Router();

module.exports = (userModel, authMiddleware) => {
    // Register user in MongoDB after Firebase signup
    router.post('/register', async (req, res) => {
        try {
            const { firebaseUid, email, displayName } = req.body;

            if (!firebaseUid || !email) {
                return res.status(400).json({
                    error: 'Firebase UID and email are required'
                });
            }

            // Check if user already exists
            const existingUser = await userModel.findByFirebaseUid(firebaseUid);
            if (existingUser) {
                return res.status(200).json({
                    message: 'User already registered',
                    user: existingUser
                });
            }

            // Create new user
            const user = await userModel.createUser({
                firebaseUid,
                email,
                displayName
            });

            res.status(201).json({
                message: 'User registered successfully',
                user
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                error: 'Failed to register user'
            });
        }
    });

    // Get current user profile
    router.get('/me', authMiddleware, async (req, res) => {
        try {
            res.json({
                user: req.user
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({
                error: 'Failed to get user profile'
            });
        }
    });

    return router;
};
