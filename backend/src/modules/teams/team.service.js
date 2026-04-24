const Team = require("../../shared/models/team.model");
const User = require("../../shared/models/user.model");

exports.createTeam = async (name, description, adminId, memberIds = []) => {
    const team = await Team.create({
        name,
        description,
        admin: adminId,
        members: memberIds 
    });

    await User.findByIdAndUpdate(adminId, { $addToSet: { teams: team._id } });

    if (memberIds.length > 0) {
        await User.updateMany(
            { _id: { $in: memberIds } },
            { $addToSet: { teams: team._id } }
        );
    }

    return team;
};

exports.addMemberToTeam = async (teamId, email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found with this email");

    await Team.findByIdAndUpdate(teamId, { $addToSet: { members: user._id } });
    await User.findByIdAndUpdate(user._id, { $addToSet: { teams: teamId } });
    
    return user;
};

exports.addMembersToTeam = async (teamId, emails) => {
    const users = await User.find({ email: { $in: emails } });
    const foundUserIds = users.map(user => user._id);
    const foundEmails = users.map(user => user.email);
    
    const notFoundEmails = emails.filter(email => !foundEmails.includes(email));

    if (foundUserIds.length === 0) {
        throw new Error("None of the provided emails are registered users.");
    }

    await Team.findByIdAndUpdate(teamId, {
        $addToSet: { members: { $each: foundUserIds } }
    });

    await User.updateMany(
        { _id: { $in: foundUserIds } },
        { $addToSet: { teams: teamId } }
    );

    return {
        addedCount: foundUserIds.length,
        notFoundEmails
    };
};

exports.updateTeam = async (id, updateData) => {
    const { name, description, members } = updateData;

    const team = await Team.findByIdAndUpdate(
        id,
        { 
            $set: { 
                name, 
                description, 
                members 
            } 
        },
        { new: true }
    ).populate("members", "name email");

    
    
    return team;
};

exports.softDeleteTeam = async (id) => {
    const team = await Team.findByIdAndUpdate(
        id,
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!team) throw new Error("Team not found");
    
    return team;
};

exports.getAllTeams = async () => {
    return await Team.find({ isDeleted: { $ne: true } }) 
        .populate("admin", "name email")
        .populate("members", "name email");
};