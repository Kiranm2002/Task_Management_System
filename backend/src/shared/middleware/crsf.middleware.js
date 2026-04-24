const crypto = require("crypto");

exports.setupCSRF = (req, res, next) => {
    if (req.cookies["XSRF-TOKEN"]) return next();

    const token = crypto.randomBytes(32).toString("hex");

    res.cookie("XSRF-TOKEN", token, {
        httpOnly: false, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/"
    });

    next();
};

exports.verifyCSRF = (req, res, next) => {
    const cookieToken = req.cookies["XSRF-TOKEN"];
    const headerToken = req.headers["x-xsrf-token"];

    if (!cookieToken || cookieToken !== headerToken) {
        return res.status(403).json({ 
            success: false, 
            message: "CSRF token mismatch or missing. Action denied." 
        });
    }

    next();
};