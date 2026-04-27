const User = require("../../shared/models/user.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const emailService = require("../../shared/services/email.service");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const { setCache, getCache, delCache } = require("../../shared/services/cache.service");

const CACHE_EXPIRY = 7 * 24 * 60 * 60;

exports.registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({
        name,
        email,
        password,
        role,
        verificationToken,
        verificationTokenExpires: tokenExpiry,
        isVerified: false
    });

    try {
        await emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (mailError) {
        console.error("Mail Delivery Failed:", mailError);
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    await setCache(`refreshToken:${user._id}`, refreshToken, CACHE_EXPIRY);

    return { user, accessToken, refreshToken };
};


exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid credentials");

    if (!user.isVerified) throw new Error("Please verify your email before logging in.");

    if (user.isLocked()) {
        const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new Error(`Account locked. Try again in ${remaining} minutes.`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await user.incrementLoginAttempts();
        throw new Error("Invalid credentials");
    }

    await user.resetLoginAttempts();

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    await setCache(`refreshToken:${user._id}`, refreshToken, CACHE_EXPIRY);

    return { 
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled 
        }, 
        accessToken, 
        refreshToken 
    };
};

exports.verifyEmailToken = async (token) => {
    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("Token is invalid or has expired.");

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    return true;
};

exports.refreshUserTokens = async (refreshToken) => {
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        throw new Error(err.name === "TokenExpiredError" ? "Refresh token expired" : "Invalid refresh token");
    }

    const redisKey = `refreshToken:${decoded.id}`;
    const storedToken = await getCache(redisKey);

    if (!storedToken || storedToken !== refreshToken) {
        await delCache(redisKey);
        throw new Error("Security breach detected. Please login again.");
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new Error("User account is inactive or not found");

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id, role: user.role });

    await setCache(redisKey, newRefreshToken, CACHE_EXPIRY);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

exports.processForgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) return true;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    try {
        const savedUser = await user.save();
    } catch (dbError) {
        throw new Error("Could not save reset token to database.");
    }
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
    return true;
};

exports.processResetPassword = async (token, newPassword) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) throw new Error("Token is invalid or has expired");

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return true;
};

exports.resendUserVerification = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("Account already verified");

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await emailService.sendVerificationEmail(user.email, newToken);
    return true;
};

exports.setup2FA = async (userId) => {
    const user = await User.findById(userId);
    
    const secret = speakeasy.generateSecret({
        name: `TaskManager (${user.email})`
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return { qrCodeUrl, secret: secret.base32 };
};

exports.activate2FA = async (userId, token) => {

    const user = await User.findById(userId).select("+twoFactorSecret");

    if (!user || !user.twoFactorSecret) {
        throw new Error("2FA Setup was not initialized correctly.");
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window:1
    });

    if (verified) {
        user.twoFactorEnabled = true;
        await user.save();
    }
    
    return verified;
};

exports.verify2FALogin = async (userId, token) => {
    const User = require("../../shared/models/user.model"); 

    const user = await User.findById(userId).select("+twoFactorSecret"); 

    if (!user) {
        throw new Error("User not found");
    }

    if (!user.twoFactorSecret) {
        throw new Error("2FA not set up for this user");
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window:1
    });


    if (!verified) throw new Error("Invalid 2FA code");

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    await setCache(`refreshToken:${user._id}`, refreshToken, CACHE_EXPIRY);

    return { user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
        }, accessToken, refreshToken };
};

exports.logoutUser = async (userId) => {
    await delCache(`refreshToken:${userId}`);
    return true;
};

