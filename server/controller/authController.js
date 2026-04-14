const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const generateTokens = (userPayload) => {
    const accessToken = jwt.sign(
        userPayload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        userPayload,
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

const getCookieConfig = () => {
    // Render doesn't always strictly set NODE_ENV, so we safely fallback to checking if it's a deployed client
    const isProd = process.env.NODE_ENV === 'production' || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    };
};

const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.json({ status: false, message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        res.json({ status: true, message: "User created successfully", user: newUser.rows[0] });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ status: false, message: "Server error" });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(200).json({ status: false, message: "Invalid credentials" });
        }

        if (!user.rows[0].password) {
            return res.status(200).json({ status: false, message: "This account uses Google Login" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(200).json({ status: false, message: "Invalid credentials" });
        }

        const { accessToken, refreshToken } = generateTokens({ id: user.rows[0].id, username: user.rows[0].username, avatar_url: user.rows[0].avatar_url, google_name: user.rows[0].google_name });

        res.cookie('refreshToken', refreshToken, getCookieConfig());

        res.json({ status: true, token: accessToken, username: user.rows[0].username });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: false, message: "Server error" });
    }
};

const googleCallback = (req, res) => {
    if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=Authentication%20failed`);
    }

    const { accessToken, refreshToken } = generateTokens({ id: req.user.id, username: req.user.username, avatar_url: req.user.avatar_url, google_name: req.user.google_name });

    res.cookie('refreshToken', refreshToken, getCookieConfig());

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${accessToken}`);
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
        const userRes = await db.query('SELECT id, username, google_id, created_at, avatar_url, google_name FROM users WHERE id = $1', [decoded.id]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid user" });
        }

        const { accessToken } = generateTokens({ id: userRes.rows[0].id, username: userRes.rows[0].username, avatar_url: userRes.rows[0].avatar_url, google_name: userRes.rows[0].google_name });

        res.json({
            success: true,
            accessToken,
            user: userRes.rows[0]
        });
    } catch (err) {
        res.clearCookie('refreshToken', getCookieConfig());
        return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }
};

const logout = (req, res) => {
    res.clearCookie('refreshToken', getCookieConfig());
    res.json({ success: true, message: "Logged out successfully" });
};

const checkStatus = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const userRes = await db.query('SELECT id, username, google_id, created_at, avatar_url, google_name FROM users WHERE id = $1', [decoded.id]);
            if (userRes.rows.length > 0) {
                return res.json({
                    success: true,
                    user: userRes.rows[0]
                });
            }
        } catch (err) {
            console.error("JWT Verification failed in /status:", err.message);
        }
    }

    if (req.isAuthenticated()) {
        res.json({
            success: true,
            user: req.user
        })
    } else {
        res.json({
            success: false,
            user: null
        })
    }
}

module.exports = {
    register,
    login,
    googleCallback,
    checkStatus,
    refresh,
    logout
};
