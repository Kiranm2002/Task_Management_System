const jwt = require("jsonwebtoken");
const User = require("../models/user.model"); 
const { getCache } = require("../services/cache.service"); 

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    
    const isBlacklisted = await getCache(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token has been revoked. Please login again." });
    }

    
    const user = await User.findById(decoded.id).select("isActive role");
    
    if (!user) {
      return res.status(404).json({ message: "User no longer exists." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated. Contact Admin." });
    }

    req.user = {
      id: user._id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please refresh." });
    }
    return res.status(401).json({ message: "Invalid token authentication failed." });
  }
};

module.exports = authMiddleware;