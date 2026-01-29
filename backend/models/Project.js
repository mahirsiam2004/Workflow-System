const { ObjectId } = require('mongodb');

class Project {
    constructor(db) {
        this.collection = db.collection('projects');
    }

    async createProject(projectData) {
        const project = {
            title: projectData.title,
            description: projectData.description,
            buyerId: new ObjectId(projectData.buyerId),
            assignedSolverId: null,
            status: 'open', // open, assigned, in_progress, completed
            budget: projectData.budget || 0,
            deadline: projectData.deadline ? new Date(projectData.deadline) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection.insertOne(project);
        return { ...project, _id: result.insertedId };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByBuyerId(buyerId) {
        return await this.collection.find({
            buyerId: new ObjectId(buyerId)
        }).toArray();
    }

    async findOpenProjects() {
        return await this.collection.find({
            status: 'open'
        }).toArray();
    }

    async findBySolverId(solverId) {
        return await this.collection.find({
            assignedSolverId: new ObjectId(solverId)
        }).toArray();
    }

    async getAllProjects() {
        return await this.collection.find({}).toArray();
    }

    async updateProject(projectId, updateData) {
        const allowedUpdates = ['title', 'description', 'budget', 'deadline'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field];
            }
        });

        if (updateData.deadline) {
            updates.deadline = new Date(updateData.deadline);
        }

        updates.updatedAt = new Date();

        const result = await this.collection.updateOne(
            { _id: new ObjectId(projectId) },
            { $set: updates }
        );

        return result.modifiedCount > 0;
    }

    async assignSolver(projectId, solverId) {
        const result = await this.collection.updateOne(
            { _id: new ObjectId(projectId) },
            {
                $set: {
                    assignedSolverId: new ObjectId(solverId),
                    status: 'assigned',
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async updateStatus(projectId, status) {
        const validStatuses = ['open', 'assigned', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(projectId) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async deleteProject(projectId) {
        const result = await this.collection.deleteOne({
            _id: new ObjectId(projectId)
        });

        return result.deletedCount > 0;
    }
}

module.exports = Project;
