const User = require("../models/user.model");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role isActive");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user.id !== user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("_id name email role");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      {isActive:false},
      {new:true}
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deactivated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};