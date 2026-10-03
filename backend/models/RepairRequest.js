const mongoose = require("mongoose");

const repairRequestSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      required: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerPhone: {
      type: String,
      required: true
    },

    equipment: {
      type: String,
      required: true
    },

    equipmentType: {
      type: String,
      default: ""
    },

    customEquipment: {
      type: String,
      default: ""
    },

    problem: {
      type: String,
      required: true
    },

    images: [
      {
        type: String
      }
    ],

    status: {
      type: String,
      enum: ["New", "In progress", "Completed"],
      default: "New"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RepairRequest",
  repairRequestSchema
);