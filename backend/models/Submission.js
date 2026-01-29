const { ObjectId } = require('mongodb');

class Submission {
    constructor(db) {
        this.collection = db.collection('submissions');
    }

    async createSubmission(submissionData) {
        const submission = {
            taskId: new ObjectId(submissionData.taskId),
            fileId: new ObjectId(submissionData.fileId),
            fileName: submissionData.fileName,
            submittedAt: new Date(),
            reviewStatus: 'pending', // pending, accepted, rejected
            reviewComment: null,
            reviewedAt: null
        };

        const result = await this.collection.insertOne(submission);
        return { ...submission, _id: result.insertedId };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByTaskId(taskId) {
        return await this.collection.findOne({
            taskId: new ObjectId(taskId)
        });
    }

    async updateReview(submissionId, reviewData) {
        const validStatuses = ['pending', 'accepted', 'rejected'];
        if (!validStatuses.includes(reviewData.reviewStatus)) {
            throw new Error('Invalid review status');
        }

        const result = await this.collection.updateOne(
            { _id: new ObjectId(submissionId) },
            {
                $set: {
                    reviewStatus: reviewData.reviewStatus,
                    reviewComment: reviewData.reviewComment || null,
                    reviewedAt: new Date()
                }
            }
        );

        return result.modifiedCount > 0;
    }

    async deleteSubmission(submissionId) {
        const result = await this.collection.deleteOne({
            _id: new ObjectId(submissionId)
        });

        return result.deletedCount > 0;
    }

    async findByProjectId(projectId, taskModel) {
        // Get all tasks for the project
        const tasks = await taskModel.findByProjectId(projectId);
        const taskIds = tasks.map(task => task._id);

        // Get all submissions for these tasks
        return await this.collection.find({
            taskId: { $in: taskIds }
        }).toArray();
    }
}

module.exports = Submission;
