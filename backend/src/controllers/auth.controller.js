const User = require("../models/user.model");
const jwt = require("jsonwebtoken")
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const {setCache, getCache} = require("../services/cache.service")


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    const user = await User.create({
      name,
      email,
      password,
      role,
    });
    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
      role:user.role
    });
    const redisKey = `refreshToken:${user._id}`;
    await setCache(redisKey, refreshToken, 7 * 24 * 60 * 60);

    res.status(201).json({
      message: "User registered successfully",
      accessToken:accessToken,
      refreshToken:refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }


    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
      role:user.role
    });

    const redisKey = `refreshToken:${user._id}`;
    await setCache(redisKey, refreshToken, 7 * 24 * 60 * 60);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAccessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });
    res.status(200).json({
      accessToken: newAccessToken,
    });
    
  } catch (error) {
    console.error("Refresh Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};