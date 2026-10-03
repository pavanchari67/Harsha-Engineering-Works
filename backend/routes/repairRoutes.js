const express = require("express");
const router = express.Router();

const RepairRequest = require("../models/RepairRequest");
const User = require("../models/User");

// =====================================================
// CREATE NEW JOB
// POST /api/jobs
// =====================================================
router.post("/", async (req, res) => {
    try {
        const {
            id,
            client,
            contact,
            eq,
            type,
            desc,
            media,
            phase,
            ts
        } = req.body;

        // Validate required fields
        if (!client || !contact || !eq || !type || !desc) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing"
            });
        }

        // Find customer by phone
        let customer = await User.findOne({
            phone: contact
        });

        // If user doesn't exist, create one
        if (!customer) {
            customer = await User.create({
                name: client,
                phone: contact,
                role: "customer"
            });
        }

        // Generate job ID
        const jobId =
            id ||
            "HEW-" +
            Date.now().toString().slice(-8);

        const request = new RepairRequest({
            jobId: jobId,

            customerId: customer._id,

            customerName: client,

            customerPhone: contact,

            equipment: eq,

            equipmentType: type,

            customEquipment: eq === "Others" ? type : "",

            problem: desc,

            images: Array.isArray(media) ? media : [],

            status: phase || "New"
        });

        await request.save();

        // Return data in the SAME format your frontend expects
        const frontendJob = {
            id: request.jobId,
            client: request.customerName,
            contact: request.customerPhone,
            eq: request.equipment,
            type: request.equipmentType,
            desc: request.problem,
            media: request.images || [],
            phase: request.status,
            ts: request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : new Date().toLocaleString()
        };

        res.status(201).json({
            success: true,
            message: "Repair request submitted successfully",
            data: frontendJob
        });

    } catch (error) {
        console.error("Create job error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create repair request",
            error: error.message
        });
    }
});


// =====================================================
// GET ALL JOBS
// GET /api/jobs
// =====================================================
router.get("/", async (req, res) => {
    try {
        const requests = await RepairRequest
            .find()
            .sort({ createdAt: -1 });

        const jobs = requests.map(request => ({
            id: request.jobId,
            client: request.customerName,
            contact: request.customerPhone,
            eq: request.equipment,
            type: request.equipmentType,
            desc: request.problem,
            media: request.images || [],
            phase: request.status,
            ts: request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : ""
        }));

        res.json({
            success: true,
            data: jobs
        });

    } catch (error) {
        console.error("Fetch jobs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch repair requests"
        });
    }
});


// =====================================================
// UPDATE JOB STATUS
// PATCH /api/jobs/:id/status
// =====================================================
router.patch("/:id/status", async (req, res) => {
    try {
        const { phase } = req.body;

        const allowedStatuses = [
            "New",
            "In progress",
            "Completed"
        ];

        if (!allowedStatuses.includes(phase)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const request = await RepairRequest.findOneAndUpdate(
            { jobId: req.params.id },
            { status: phase },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = {
            id: request.jobId,
            client: request.customerName,
            contact: request.customerPhone,
            eq: request.equipment,
            type: request.equipmentType,
            desc: request.problem,
            media: request.images || [],
            phase: request.status,
            ts: request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : ""
        };

        res.json({
            success: true,
            message: "Status updated successfully",
            data: job
        });

    } catch (error) {
        console.error("Update status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update status"
        });
    }
});


module.exports = router;