const User = require("../../shared/models/user.model");

exports.getAllUsers = async () => {
    return await User.find({role:"user", isActive:true}, "-password")
        .populate("teams", "name")
        .sort({ createdAt: -1 });
};

exports.getUserProfile = async (userId) => {
    return await User.findById(userId)
        .populate("teams", "name description")
        .select("-password");
};

exports.updateSelf = async (userId, updateData) => {
    const forbiddenFields = ["password", "role", "isVerified", "teams"];
    forbiddenFields.forEach(field => delete updateData[field]);

    return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password");
};

exports.adminUpdateUser = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password");
};

exports.deactivateUser = async (userId) => {
    return await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
};