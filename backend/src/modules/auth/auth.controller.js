const authService = require("./auth.service");
const User = require("../../shared/models/user.model")
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email.",
            ...result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.setup2FA = async (req, res) => {
    try {
        const result = await authService.setup2FA(req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to initialize 2FA setup" });
    }
};

exports.verifyAndEnable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const isVerified = await authService.activate2FA(req.user.id, token);

        if (!isVerified) {
            return res.status(400).json({ message: "Invalid OTP code. Setup failed." });
        }

        res.status(200).json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
        res.status(500).json({ message: "2FA verification error" });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.twoFactorEnabled) {
            return res.status(200).json({
                success: true,
                require2FA: true, 
                userId: user._id,
                message: "Please enter your 2FA code"
            });
        }

        const result = await authService.loginUser(email, password);
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'None', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

exports.verifyEmail = async (req, res,next) => {
    try {
        await authService.verifyEmailToken(req.params.token);
        res.status(200).json({ message: "Email verified successfully." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.login2FA = async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing userId or OTP token" 
            });
        }

        const result = await authService.verify2FALogin(userId, token);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(401).json({ success: false, message: "Invalid 2FA code" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken; 
        
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }
        const result = await authService.refreshUserTokens(refreshToken);

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });
        res.status(200).json({ accessToken:result.accessToken,
            user: { id: user._id, role: user.role, email: user.email, name:user.name }
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        await authService.processForgotPassword(req.body.email);
        res.status(200).json({ message: `A Reset link has been sent to ${req.body.email}.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        await authService.processResetPassword(req.params.token, req.body.password);
        res.status(200).json({ message: "Password reset successful." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        await authService.resendUserVerification(req.body.email);
        res.status(200).json({ message: "Verification email resent." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        await authService.logoutUser(req.user.id);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Logout failed",error:error.message });
    }
};