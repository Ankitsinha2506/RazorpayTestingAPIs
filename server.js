const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");
require("dotenv").config();

// Initialize app and Razorpay instance
const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API to create an order
app.post("/create-order", async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;

        // Razorpay order options
        const options = {
            amount: amount * 100, // Amount in paise
            currency: currency || "INR", // Default is INR
            receipt: receipt || "receipt#1",
        };

        // Create order
        const order = await razorpay.orders.create(options);
        res.status(201).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// API to verify payment
app.post("/verify-payment", (req, res) => {
    try {
        const { order_id, payment_id, signature } = req.body;

        // Generate signature
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(order_id + "|" + payment_id);
        const generatedSignature = hmac.digest("hex");

        // Compare signatures
        if (generatedSignature === signature) {
            res.status(200).json({ success: true, message: "Payment verified!" });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed!" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
