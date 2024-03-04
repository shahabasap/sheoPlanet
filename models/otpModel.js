const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    timestamp: { type: Date, default: Date.now } // Adding timestamp to the schema
}, {
    timestamps: true
});

const OtpModel = mongoose.model('Otp', otpSchema);

module.exports = OtpModel;
