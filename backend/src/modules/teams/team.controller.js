const teamService = require("./team.service");


exports.createTeam = async (req, res) => {
    try {
        const { name, description,members } = req.body;
        
        const team = await teamService.createTeam(name, description, req.user.id,members);

        res.status(201).json({
            success: true,
            message: "Team created successfully",
            team
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to create team", error: error.message });
    }
};


exports.addMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { emails } = req.body;
        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ message: "Please provide an array of emails." });
        }
        const result = await teamService.addMembersToTeam(teamId, emails);

        
        res.status(200).json({
            success: true,
            message: "Team members updated.",
            addedCount: result.addedCount,
            notFound: result.notFoundEmails 
        });
    } catch (error) {
        const status = error.message === "User not found with this email" ? 404 : 500;
        res.status(status).json({ message: error.message });
    }
};


exports.getTeams = async (req, res) => {
    try {
        const teams = await teamService.getAllTeams();
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teams" });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, members } = req.body;

        const updatedTeam = await teamService.updateTeam(id, { name, description, members });

        res.status(200).json({
            success: true,
            message: "Team updated successfully",
            team: updatedTeam
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update team", error: error.message });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        
        await teamService.softDeleteTeam(id);

        res.status(200).json({
            success: true,
            message: "Team deleted successfully (soft delete)"
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete team", error: error.message });
    }
};