const { ObjectId } = require('mongodb');

class Request {
    constructor(db) {
        this.collection = db.collection('requests');
    }

    async createRequest(requestData) {
        const request = {
            projectId: new ObjectId(requestData.projectId),
            solverId: new ObjectId(requestData.solverId),
            message: requestData.message || '',
            status: 'pending', // pending, accepted, rejected
            createdAt: new Date()
        };

        const result = await this.collection.insertOne(request);
        return { ...request, _id: result.insertedId };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByProjectId(projectId) {
        return await this.collection.find({
            projectId: new ObjectId(projectId)
        }).toArray();
    }

    async findBySolverId(solverId) {
        return await this.collection.find({
            solverId: new ObjectId(solverId)
        }).toArray();
    }

    async checkExistingRequest(projectId, solverId) {
        return await this.collection.findOne({
            projectId: new ObjectId(projectId),
            solverId: new ObjectId(solverId)
        });
    }

    async updateStatus(requestId, status) {
        const validStatuses = ['pending', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(requestId) },
            { $set: { status } }
        );

        return result.modifiedCount > 0;
    }

    async rejectOtherRequests(projectId, acceptedRequestId) {
        const result = await this.collection.updateMany(
            {
                projectId: new ObjectId(projectId),
                _id: { $ne: new ObjectId(acceptedRequestId) },
                status: 'pending'
            },
            { $set: { status: 'rejected' } }
        );

        return result.modifiedCount;
    }
}

module.exports = Request;
