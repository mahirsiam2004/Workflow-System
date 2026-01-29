const { ObjectId } = require('mongodb');

class Task {
    constructor(db) {
        this.collection = db.collection('tasks');
    }

    async createTask(taskData) {
        const task = {
            projectId: new ObjectId(taskData.projectId),
            title: taskData.title,
            description: taskData.description || '',
            deadline: taskData.deadline ? new Date(taskData.deadline) : null,
            status: 'pending', // pending, in_progress, submitted, completed
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection.insertOne(task);
        return { ...task, _id: result.insertedId };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByProjectId(projectId) {
        return await this.collection.find({
            projectId: new ObjectId(projectId)
        }).sort({ createdAt: 1 }).toArray();
    }

    async updateTask(taskId, updateData) {
        const allowedUpdates = ['title', 'description', 'deadline', 'status'];
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
            { _id: new ObjectId(taskId) },
            { $set: updates }
        );

        return result.modifiedCount > 0;
    }

    async updateStatus(taskId, status) {
        const validStatuses = ['pending', 'in_progress', 'submitted', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(taskId) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async deleteTask(taskId) {
        const result = await this.collection.deleteOne({
            _id: new ObjectId(taskId)
        });

        return result.deletedCount > 0;
    }

    async getProjectTaskStats(projectId) {
        const tasks = await this.findByProjectId(projectId);
        const stats = {
            total: tasks.length,
            pending: 0,
            in_progress: 0,
            submitted: 0,
            completed: 0
        };

        tasks.forEach(task => {
            stats[task.status]++;
        });

        return stats;
    }
}

module.exports = Task;
