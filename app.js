const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose"); 

dotenv.config(); 

const userRoutes = require("./Routes/userRoute");
const expenseRoutes = require("./Routes/expenseRoute");
const purchaseRoutes = require("./Routes/purchaseRoutes");
const leaderBoard = require("./Routes/leaderBoard");
const forgetPassword = require("./Routes/forgetPasswordRoute");
const analyticsRoute = require("./Routes/reportGenerationRoute");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/user/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/user/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
})

app.use("/user", userRoutes); 
app.use("/expense", expenseRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/leaderBoard", leaderBoard);
app.use("/passwordreset", forgetPassword);
app.use("/analytics", analyticsRoute);

const PORT = process.env.PORT || 3000;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
};

connectDB();

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is live on http://localhost:${PORT}`);
  });
}

module.exports = app;
