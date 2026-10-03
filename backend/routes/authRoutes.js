const express = require("express");
const router = express.Router();

const User = require("../models/User");

// Temporary OTP storage
// Later we can replace this with a real SMS provider.
const otpStore = new Map();


// =====================================================
// CHECK USER
// POST /api/auth/check-user
// =====================================================
router.post("/check-user", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        const user = await User.findOne({ phone });

        res.json({
            success: true,
            exists: !!user,
            user: user || null
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// =====================================================
// SEND OTP
// POST /api/auth/send-otp
// =====================================================
router.post("/send-otp", async (req, res) => {
    try {
        const { phone, mode, name } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit phone number"
            });
        }

        // Check signup/login conditions
        const existingUser = await User.findOne({ phone });

        if (mode === "signup" && existingUser) {
            return res.json({
                success: false,
                message: "This number is already registered. Please Login."
            });
        }

        if (mode === "login" && !existingUser) {
            return res.json({
                success: false,
                message: "Number not registered. Please Sign Up first."
            });
        }

        // Generate 4-digit OTP
        const otp =
            Math.floor(1000 + Math.random() * 9000).toString();

        otpStore.set(phone, {
            otp,
            mode,
            name: name || "",
            expires: Date.now() + 5 * 60 * 1000
        });

        console.log(`OTP for ${phone}: ${otp}`);

        // DEVELOPMENT MODE
        // No SMS provider yet.
        res.json({
            success: true,
            message: "OTP generated successfully",
            devOtp: otp
        });

    } catch (error) {
        console.error("Send OTP error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
});


// =====================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// =====================================================
router.post("/verify-otp", async (req, res) => {
    try {
        const {
            phone,
            otp,
            name,
            mode
        } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP are required"
            });
        }

        const savedOtp = otpStore.get(phone);

        if (!savedOtp) {
            return res.status(400).json({
                success: false,
                message: "OTP expired or not found"
            });
        }

        if (Date.now() > savedOtp.expires) {
            otpStore.delete(phone);

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        if (savedOtp.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        let user = await User.findOne({ phone });

        // SIGN UP
        if (mode === "signup") {

            if (user) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists"
                });
            }

            user = await User.create({
                name: name || "Customer",
                phone: phone,
                role: "customer"
            });
        }

        // LOGIN
        if (mode === "login") {

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        otpStore.delete(phone);

        res.json({
            success: true,
            message: "Authentication successful",
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Verify OTP error:", error);

        res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
});


// =====================================================
// UPDATE NAME
// POST /api/auth/update-name
// =====================================================
router.post("/update-name", async (req, res) => {
    try {
        const { phone, name } = req.body;

        if (!phone || !name) {
            return res.status(400).json({
                success: false,
                message: "Phone and name are required"
            });
        }

        const user = await User.findOneAndUpdate(
            { phone },
            { name: name.trim() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Name updated successfully",
            user
        });

    } catch (error) {
        console.error("Update name error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update name"
        });
    }
});


module.exports = router;