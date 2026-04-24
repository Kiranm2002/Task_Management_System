const userService = require("./user.service");


exports.getProfile = async (req, res) => {
    try {
        const user = await userService.getUserProfile(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.updateUser = async (req, res) => {
  try{
    const user = await userService.adminUpdateUser(req.params.id, req.body);
    res.status(200).json(user);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
    
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await userService.updateSelf(req.user.id, req.body);
        res.status(200).json({ message: "Profile updated", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const user = await userService.deactivateUser(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User deactivated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};