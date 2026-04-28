require('dotenv').config();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');
const Brevo = require('@getbrevo/brevo');

const User = require('../Models/userModel');
const ForgotPasswordRequest = require("../Models/forgotPasswordModel");

const BREVO_KEY = process.env.BREVO_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const log = (...args) => console.log("[FP]", ...args);

const serveResetPasswordForm = async (req, res) => {
  const uuid = req.params.uuid;
  log("serveResetPasswordForm hit with uuid:", uuid);

  try {
    const request = await ForgotPasswordRequest.findOne({ id: uuid, isActive: true });
    log("Found request:", !!request);

    if (!request) {
      log("Invalid/expired link");
      return res.status(400).send("Invalid or expired password reset link");
    }

    const oneHour = 60 * 60 * 1000;
    const age = Date.now() - new Date(request.createdAt).getTime();
    log("Request age (ms):", age);

    if (age > oneHour) {
      log("Link expired, marking inactive");
      request.isActive = false;
      await request.save();
      return res.status(400).send("Link expired. Please request a new one.");
    }

    res.sendFile(path.join(__dirname, "../public/reset-password.html"));
  } catch (err) {
    console.error("[FP] Error in serveResetPasswordForm:", err);
    res.status(500).send("Server error");
  }
};

const getPasswordLink = async (req, res) => {
  const { email } = req.body;
  log("getPasswordLink called with email:", email);
  log("ENV CHECK -> BREVO_KEY exists?", !!BREVO_KEY, "BASE_URL:", BASE_URL);

  try {
    if (!email || !email.includes("@")) {
      log("Invalid email format");
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    log("User found?", !!user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with that email" });
    }

    const requestId = uuidv4();
    log("Generated requestId:", requestId);

    const created = await ForgotPasswordRequest.create({
      id: requestId,
      userId: user._id,
      isActive: true
    });
    log("ForgotPasswordRequest created:", created ? created.id : null);

    const resetLink = `${BASE_URL}/passwordreset/resetpassword/${requestId}`;
    log("Reset link:", resetLink);

    try {
      if (!BREVO_KEY) {
        log("BREVO_KEY missing! Aborting email send.");
        return res.status(500).json({ success: false, message: "Email service not configured" });
      }

      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_KEY);

      const sendSmtpEmail = {
        to: [{ email }],
        sender: { name: "Expense Tracker", email: "abhiaskar.18@gmail.com" },
        subject: "Reset your password",
        htmlContent: `
          <p>Hi there,</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
        `
      };

      log("Sending email via Brevo...");
      const emailResp = await apiInstance.sendTransacEmail(sendSmtpEmail);
      log("Brevo response status:", emailResp?.response?.statusCode || "N/A");

    } catch (emailError) {
      console.error("[FP] Brevo Email Error:", emailError?.response?.body || emailError.message || emailError);
      return res.status(500).json({ success: false, message: "Failed to send reset email" });
    }

    res.status(200).json({ success: true, message: "Reset link sent successfully" });
  } catch (error) {
    console.error("[FP] Error in getPasswordLink:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const updatePassword = async (req, res) => {
  const { newPassword, resetId } = req.body;
  log("updatePassword called with resetId:", resetId);

  try {
    if (!newPassword || newPassword.length < 6) {
      log("Password too short");
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const request = await ForgotPasswordRequest.findOne({ id: resetId });
    log("ForgotPasswordRequest found?", !!request, "isActive:", request?.isActive);

    if (!request || !request.isActive) {
      return res.status(400).json({ success: false, message: "Invalid or expired link" });
    }

    const user = await User.findById(request.userId);
    log("User found?", !!user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    log("Password updated for user:", user._id.toString());

    request.isActive = false;
    await request.save();
    log("Reset request marked inactive");

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("[FP] Error updating password:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPasswordLink,
  updatePassword,
  serveResetPasswordForm
};
