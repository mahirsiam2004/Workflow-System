const { ObjectId } = require('mongodb');

class User {
    constructor(db) {
        this.collection = db.collection('users');
    }

    async createUser(userData) {
        const user = {
            firebaseUid: userData.firebaseUid,
            email: userData.email,
            displayName: userData.displayName || '',
            role: 'user', // Default role
            profileData: {
                bio: '',
                skills: [],
                portfolio: ''
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection.insertOne(user);
        return { ...user, _id: result.insertedId };
    }

    async findByFirebaseUid(firebaseUid) {
        return await this.collection.findOne({ firebaseUid });
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email });
    }

    async updateRole(userId, role) {
        const validRoles = ['user', 'buyer', 'problemSolver', 'admin'];
        if (!validRoles.includes(role)) {
            throw new Error('Invalid role');
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    role,
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async updateProfile(userId, profileData) {
        const result = await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    'profileData.bio': profileData.bio || '',
                    'profileData.skills': profileData.skills || [],
                    'profileData.portfolio': profileData.portfolio || '',
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async getAllUsers() {
        return await this.collection.find({}).toArray();
    }

    async getUsersByRole(role) {
        return await this.collection.find({ role }).toArray();
    }
}

module.exports = User;
