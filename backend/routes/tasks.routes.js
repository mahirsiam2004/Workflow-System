const express = require('express');
const router = express.Router();

module.exports = (taskModel, projectModel, authMiddleware, roleCheck) => {
    // Create task (Assigned Problem Solver only)
    router.post('/', authMiddleware, roleCheck('problemSolver'), async (req, res) => {
        try {
            const { projectId, title, description, deadline } = req.body;

            if (!projectId || !title) {
                return res.status(400).json({
                    error: 'Project ID and title are required'
                });
            }

            const project = await projectModel.findById(projectId);

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

            const task = await taskModel.createTask({
                projectId,
                title,
                description,
                deadline
            });

            // Update project status to in_progress if it's still assigned
            if (project.status === 'assigned') {
                await projectModel.updateStatus(projectId, 'in_progress');
            }

            res.status(201).json({
                message: 'Task created successfully',
                task
            });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({
                error: 'Failed to create task'
            });
        }
    });

    // Get tasks for a project
    router.get('/project/:projectId', authMiddleware, async (req, res) => {
        try {
            const project = await projectModel.findById(req.params.projectId);

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user has access to this project
            const isBuyer = project.buyerId.toString() === req.user._id.toString();
            const isSolver = project.assignedSolverId &&
                project.assignedSolverId.toString() === req.user._id.toString();
            const isAdmin = req.user.role === 'admin';

            if (!isBuyer && !isSolver && !isAdmin) {
                return res.status(403).json({
                    error: 'You do not have access to this project'
                });
            }

            const tasks = await taskModel.findByProjectId(req.params.projectId);
            const stats = await taskModel.getProjectTaskStats(req.params.projectId);

            res.json({
                tasks,
                stats
            });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({
                error: 'Failed to get tasks'
            });
        }
    });

    // Update task (Assigned Problem Solver only)
    router.patch('/:id', authMiddleware, roleCheck('problemSolver'), async (req, res) => {
        try {
            const task = await taskModel.findById(req.params.id);

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

            const { title, description, deadline, status } = req.body;

            const success = await taskModel.updateTask(req.params.id, {
                title,
                description,
                deadline,
                status
            });

            if (!success) {
                return res.status(400).json({
                    error: 'Failed to update task'
                });
            }

            const updatedTask = await taskModel.findById(req.params.id);

            res.json({
                message: 'Task updated successfully',
                task: updatedTask
            });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({
                error: error.message || 'Failed to update task'
            });
        }
    });

    // Delete task (Assigned Problem Solver only)
    router.delete('/:id', authMiddleware, roleCheck('problemSolver'), async (req, res) => {
        try {
            const task = await taskModel.findById(req.params.id);

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

            const success = await taskModel.deleteTask(req.params.id);

            if (!success) {
                return res.status(400).json({
                    error: 'Failed to delete task'
                });
            }

            res.json({
                message: 'Task deleted successfully'
            });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({
                error: 'Failed to delete task'
            });
        }
    });

    return router;
};
