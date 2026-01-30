const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if service account is provided.
// For local development without FIREBASE_SERVICE_ACCOUNT, we fall back to
// decoding the Firebase ID token without verification (see below).
let firebaseApp;

try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

    if (serviceAccount) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized');
    } else {
        console.warn('⚠️ Firebase Admin SDK not initialized - FIREBASE_SERVICE_ACCOUNT not found. Falling back to unsigned token decoding for development.');
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

            // Verify Firebase token when Firebase Admin is configured.
            // If not configured (common in local/dev), fall back to *decoding*
            // the JWT payload to extract the uid without verification.
            let decodedToken;
            if (firebaseApp) {
                try {
                    decodedToken = await admin.auth().verifyIdToken(token);
                } catch (error) {
                    console.error('Firebase Admin verifyIdToken error:', error.message);
                    return res.status(401).json({
                        error: 'Invalid or expired token'
                    });
                }
            } else {
                try {
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        return res.status(401).json({
                            error: 'Invalid token format'
                        });
                    }

                    const payload = JSON.parse(
                        Buffer.from(parts[1], 'base64').toString('utf8')
                    );

                    const uid =
                        payload.user_id ||
                        payload.uid ||
                        payload.sub;

                    if (!uid) {
                        return res.status(401).json({
                            error: 'Invalid token payload'
                        });
                    }

                    decodedToken = { uid, ...payload };
                } catch (error) {
                    console.error('Fallback token decode error:', error.message);
                    return res.status(401).json({
                        error: 'Invalid token'
                    });
                }
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
