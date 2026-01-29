const express = require('express');
const router = express.Router();

module.exports = (requestModel, projectModel, authMiddleware, roleCheck) => {
    // Create request (Problem Solver only)
    router.post('/', authMiddleware, roleCheck('problemSolver'), async (req, res) => {
        try {
            const { projectId, message } = req.body;

            if (!projectId) {
                return res.status(400).json({
                    error: 'Project ID is required'
                });
            }

            // Check if project exists and is open
            const project = await projectModel.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            if (project.status !== 'open') {
                return res.status(400).json({
                    error: 'Project is not open for requests'
                });
            }

            // Check if solver already requested this project
            const existingRequest = await requestModel.checkExistingRequest(
                projectId,
                req.user._id.toString()
            );

            if (existingRequest) {
                return res.status(400).json({
                    error: 'You have already requested to work on this project'
                });
            }

            const request = await requestModel.createRequest({
                projectId,
                solverId: req.user._id.toString(),
                message
            });

            res.status(201).json({
                message: 'Request sent successfully',
                request
            });
        } catch (error) {
            console.error('Create request error:', error);
            res.status(500).json({
                error: 'Failed to create request'
            });
        }
    });

    // Get requests for a project (Buyer only, own projects)
    router.get('/project/:projectId', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const project = await projectModel.findById(req.params.projectId);

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only view requests for your own projects'
                });
            }

            const requests = await requestModel.findByProjectId(req.params.projectId);

            res.json({ requests });
        } catch (error) {
            console.error('Get requests error:', error);
            res.status(500).json({
                error: 'Failed to get requests'
            });
        }
    });

    // Accept request and assign solver (Buyer only)
    router.patch('/:id/accept', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const request = await requestModel.findById(req.params.id);

            if (!request) {
                return res.status(404).json({
                    error: 'Request not found'
                });
            }

            const project = await projectModel.findById(request.projectId.toString());

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only accept requests for your own projects'
                });
            }

            if (project.status !== 'open') {
                return res.status(400).json({
                    error: 'Project is not open for assignment'
                });
            }

            // Accept the request
            await requestModel.updateStatus(req.params.id, 'accepted');

            // Assign solver to project
            await projectModel.assignSolver(
                request.projectId.toString(),
                request.solverId.toString()
            );

            // Reject all other pending requests for this project
            await requestModel.rejectOtherRequests(
                request.projectId.toString(),
                req.params.id
            );

            const updatedProject = await projectModel.findById(request.projectId.toString());

            res.json({
                message: 'Request accepted and solver assigned',
                project: updatedProject
            });
        } catch (error) {
            console.error('Accept request error:', error);
            res.status(500).json({
                error: 'Failed to accept request'
            });
        }
    });

    // Reject request (Buyer only)
    router.patch('/:id/reject', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const request = await requestModel.findById(req.params.id);

            if (!request) {
                return res.status(404).json({
                    error: 'Request not found'
                });
            }

            const project = await projectModel.findById(request.projectId.toString());

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only reject requests for your own projects'
                });
            }

            await requestModel.updateStatus(req.params.id, 'rejected');

            res.json({
                message: 'Request rejected'
            });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({
                error: 'Failed to reject request'
            });
        }
    });

    return router;
};
