const express = require('express');
const router = express.Router();

module.exports = (submissionModel, taskModel, projectModel, authMiddleware, roleCheck, gridfs) => {
    // Submit ZIP file (Assigned Problem Solver only)
    router.post('/', authMiddleware, roleCheck('problemSolver'), gridfs.upload.single('file'), async (req, res) => {
        try {
            const { taskId } = req.body;

            if (!taskId) {
                return res.status(400).json({
                    error: 'Task ID is required'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    error: 'File is required'
                });
            }

            const task = await taskModel.findById(taskId);

            if (!task) {
                return res.status(404).json({
                    error: 'Task not found'
                });
            }

            const project = await projectModel.findById(task.projectId.toString());

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user is assigned to this project
            if (!project.assignedSolverId ||
                project.assignedSolverId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You are not assigned to this project'
                });
            }

            // Check if submission already exists
            const existingSubmission = await submissionModel.findByTaskId(taskId);
            if (existingSubmission) {
                return res.status(400).json({
                    error: 'Submission already exists for this task'
                });
            }

            // Upload file to GridFS
            const fileId = await gridfs.uploadFile(
                req.file.buffer,
                req.file.originalname,
                {
                    taskId,
                    uploadedBy: req.user._id.toString(),
                    contentType: req.file.mimetype
                }
            );

            // Create submission record
            const submission = await submissionModel.createSubmission({
                taskId,
                fileId: fileId.toString(),
                fileName: req.file.originalname
            });

            // Update task status to submitted
            await taskModel.updateStatus(taskId, 'submitted');

            res.status(201).json({
                message: 'Submission uploaded successfully',
                submission
            });
        } catch (error) {
            console.error('Submit file error:', error);
            res.status(500).json({
                error: error.message || 'Failed to submit file'
            });
        }
    });

    // Get submission for a task
    router.get('/task/:taskId', authMiddleware, async (req, res) => {
        try {
            const task = await taskModel.findById(req.params.taskId);

            if (!task) {
                return res.status(404).json({
                    error: 'Task not found'
                });
            }

            const project = await projectModel.findById(task.projectId.toString());

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user has access
            const isBuyer = project.buyerId.toString() === req.user._id.toString();
            const isSolver = project.assignedSolverId &&
                project.assignedSolverId.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin';

            if (!isBuyer && !isSolver && !isAdmin) {
                return res.status(403).json({
                    error: 'You do not have access to this submission'
                });
            }

            const submission = await submissionModel.findByTaskId(req.params.taskId);

            if (!submission) {
                return res.status(404).json({
                    error: 'No submission found for this task'
                });
            }

            res.json({ submission });
        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).json({
                error: 'Failed to get submission'
            });
        }
    });

    // Download ZIP file
    router.get('/:id/download', authMiddleware, async (req, res) => {
        try {
            const submission = await submissionModel.findById(req.params.id);

            if (!submission) {
                return res.status(404).json({
                    error: 'Submission not found'
                });
            }

            const task = await taskModel.findById(submission.taskId.toString());
            const project = await projectModel.findById(task.projectId.toString());

            // Check if user has access
            const isBuyer = project.buyerId.toString() === req.user._id.toString();
            const isSolver = project.assignedSolverId &&
                project.assignedSolverId.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin';

            if (!isBuyer && !isSolver && !isAdmin) {
                return res.status(403).json({
                    error: 'You do not have access to this file'
                });
            }

            // Get file info
            const fileInfo = await gridfs.getFileInfo(submission.fileId);

            if (!fileInfo) {
                return res.status(404).json({
                    error: 'File not found'
                });
            }

            // Set headers
            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${submission.fileName}"`
            });

            // Stream file to response
            const downloadStream = gridfs.createDownloadStream(submission.fileId);
            downloadStream.pipe(res);
        } catch (error) {
            console.error('Download file error:', error);
            res.status(500).json({
                error: 'Failed to download file'
            });
        }
    });

    // Review submission (Buyer only)
    router.patch('/:id/review', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const { reviewStatus, reviewComment } = req.body;

            if (!reviewStatus) {
                return res.status(400).json({
                    error: 'Review status is required'
                });
            }

            const submission = await submissionModel.findById(req.params.id);

            if (!submission) {
                return res.status(404).json({
                    error: 'Submission not found'
                });
            }

            const task = await taskModel.findById(submission.taskId.toString());
            const project = await projectModel.findById(task.projectId.toString());

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only review submissions for your own projects'
                });
            }

            // Update submission review
            await submissionModel.updateReview(req.params.id, {
                reviewStatus,
                reviewComment
            });

            // If accepted, update task status to completed
            if (reviewStatus === 'accepted') {
                await taskModel.updateStatus(submission.taskId.toString(), 'completed');

                // Check if all tasks are completed
                const stats = await taskModel.getProjectTaskStats(task.projectId.toString());
                if (stats.total > 0 && stats.completed === stats.total) {
                    await projectModel.updateStatus(task.projectId.toString(), 'completed');
                }
            } else if (reviewStatus === 'rejected') {
                // If rejected, set task back to in_progress
                await taskModel.updateStatus(submission.taskId.toString(), 'in_progress');
            }

            const updatedSubmission = await submissionModel.findById(req.params.id);

            res.json({
                message: 'Submission reviewed successfully',
                submission: updatedSubmission
            });
        } catch (error) {
            console.error('Review submission error:', error);
            res.status(500).json({
                error: error.message || 'Failed to review submission'
            });
        }
    });

    return router;
};
