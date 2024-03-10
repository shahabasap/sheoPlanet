const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Adding TTL index to automatically expire documents after one minute (60 seconds)
otpSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 });

const OtpModel = mongoose.model('Otp', otpSchema);

module.exports = OtpModel;
