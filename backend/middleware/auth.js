const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to add your service account key to .env
let firebaseApp;

try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

    if (serviceAccount) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.warn('Firebase Admin SDK not initialized - FIREBASE_SERVICE_ACCOUNT not found');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
}

const authMiddleware = (userModel) => {
    return async (req, res, next) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'No token provided'
                });
            }

            const token = authHeader.split('Bearer ')[1];

            // Verify Firebase token
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
            } catch (error) {
                return res.status(401).json({
                    error: 'Invalid or expired token'
                });
            }

            // Get user from MongoDB
            const user = await userModel.findByFirebaseUid(decodedToken.uid);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found in database'
                });
            }

            // Attach user to request
            req.user = user;
            req.firebaseUser = decodedToken;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(500).json({
                error: 'Authentication failed'
            });
        }
    };
};

module.exports = authMiddleware;
