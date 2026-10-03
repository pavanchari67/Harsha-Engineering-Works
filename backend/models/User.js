const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["customer", "worker"],
      default: "customer"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);