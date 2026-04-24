const projectService = require("./project.service");
const taskService = require("../tasks/task.service");


exports.createProject = async (req, res) => {
    try {
        
        const { name, description, teamId, deadline, status } = req.body;
        const createdBy = req.user.id;

        if (!teamId) return res.status(400).json({ message: "Team ID is required" });

        const project = await projectService.createNewProject({
            name,
            description,
            teamId,
            deadline,
            status,
            createdBy,
            isDeleted: false 
        });

        res.status(201).json({ success: true, project });
    } catch (error) {
        res.status(500).json({ message: "Failed to create project", error: error.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await projectService.getAllProjects();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch projects", error: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid Project ID format" });
        }

        const project = await projectService.getProjectDetails(id);

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                message: "Project not found or has been deleted" 
            });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ 
            message: "Error fetching project details", 
            error: error.message 
            });
    }
};

exports.getProjectBoard = async (req, res) => {
    try {
        const { id } = req.params;
        
        const tasks = await taskService.getTasksByProjectId(id);

        const columns = {
            'backlog': { id: 'backlog', title: 'Backlog', taskIds: [] },
            'todo': { id: 'todo', title: 'To Do', taskIds: [] },
            'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
            'in-review': { id: 'in-review', title: 'Code Review', taskIds: [] },
            'blocked': { id: 'blocked', title: 'Blocked', taskIds: [] },
            'completed': { id: 'completed', title: 'Completed', taskIds: [] },
            'archived': { id: 'archived', title: 'Archived', taskIds: [] },
        };

        const taskMap = {};

        tasks.forEach(task => {
            const taskId = task._id.toString();
            taskMap[taskId] = {
                ...task._doc,
                id: taskId 
            };
            
            if (columns[task.status]) {
                columns[task.status].taskIds.push(taskId);
            } else {
                columns['backlog'].taskIds.push(taskId);
            }
        });

        res.status(200).json({
            tasks: taskMap,
            columns: columns,
            columnOrder: ['backlog', 'todo', 'in-progress', 'in-review', 'blocked', 'completed', 'archived']
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch board data", error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const updatedProject = await projectService.updateProject(req.params.id, req.body);
        if (!updatedProject) return res.status(404).json({ message: "Project not found" });
        
        res.status(200).json({ success: true, project: updatedProject });
    } catch (error) {
        res.status(500).json({ message: "Failed to update project", error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        await projectService.softDeleteProject(req.params.id);
        res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete project", error: error.message });
    }
};

exports.getTeamProjects = async (req, res) => {
    try {
        const { teamId } = req.params;
        const projects = await projectService.fetchTeamProjects(teamId);
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch projects", error: error.message });
    }
};