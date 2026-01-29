const express = require('express');
const router = express.Router();

module.exports = (projectModel, authMiddleware, roleCheck) => {
    // Create project (Buyer only)
    router.post('/', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const { title, description, budget, deadline } = req.body;

            if (!title || !description) {
                return res.status(400).json({
                    error: 'Title and description are required'
                });
            }

            const project = await projectModel.createProject({
                title,
                description,
                budget,
                deadline,
                buyerId: req.user._id.toString()
            });

            res.status(201).json({
                message: 'Project created successfully',
                project
            });
        } catch (error) {
            console.error('Create project error:', error);
            res.status(500).json({
                error: 'Failed to create project'
            });
        }
    });

    // Get all projects (filtered by role)
    router.get('/', authMiddleware, async (req, res) => {
        try {
            let projects;

            if (req.user.role === 'admin') {
                // Admin sees all projects
                projects = await projectModel.getAllProjects();
            } else if (req.user.role === 'buyer') {
                // Buyer sees their own projects
                projects = await projectModel.findByBuyerId(req.user._id.toString());
            } else if (req.user.role === 'problemSolver') {
                // Problem solver sees open projects and their assigned projects
                const openProjects = await projectModel.findOpenProjects();
                const assignedProjects = await projectModel.findBySolverId(req.user._id.toString());

                // Combine and remove duplicates
                const projectMap = new Map();
                [...openProjects, ...assignedProjects].forEach(p => {
                    projectMap.set(p._id.toString(), p);
                });
                projects = Array.from(projectMap.values());
            } else {
                projects = [];
            }

            res.json({ projects });
        } catch (error) {
            console.error('Get projects error:', error);
            res.status(500).json({
                error: 'Failed to get projects'
            });
        }
    });

    // Get project by ID
    router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const project = await projectModel.findById(req.params.id);

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            res.json({ project });
        } catch (error) {
            console.error('Get project error:', error);
            res.status(500).json({
                error: 'Failed to get project'
            });
        }
    });

    // Update project (Buyer only, own projects)
    router.patch('/:id', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const project = await projectModel.findById(req.params.id);

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only update your own projects'
                });
            }

            const { title, description, budget, deadline } = req.body;

            const success = await projectModel.updateProject(req.params.id, {
                title,
                description,
                budget,
                deadline
            });

            if (!success) {
                return res.status(400).json({
                    error: 'Failed to update project'
                });
            }

            const updatedProject = await projectModel.findById(req.params.id);

            res.json({
                message: 'Project updated successfully',
                project: updatedProject
            });
        } catch (error) {
            console.error('Update project error:', error);
            res.status(500).json({
                error: 'Failed to update project'
            });
        }
    });

    // Delete project (Buyer only, own projects)
    router.delete('/:id', authMiddleware, roleCheck('buyer'), async (req, res) => {
        try {
            const project = await projectModel.findById(req.params.id);

            if (!project) {
                return res.status(404).json({
                    error: 'Project not found'
                });
            }

            // Check if user owns the project
            if (project.buyerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: 'You can only delete your own projects'
                });
            }

            const success = await projectModel.deleteProject(req.params.id);

            if (!success) {
                return res.status(400).json({
                    error: 'Failed to delete project'
                });
            }

            res.json({
                message: 'Project deleted successfully'
            });
        } catch (error) {
            console.error('Delete project error:', error);
            res.status(500).json({
                error: 'Failed to delete project'
            });
        }
    });

    return router;
};
