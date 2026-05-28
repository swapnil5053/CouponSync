// CouponSync - Backend Server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users_new.js";
import campaignRoutes from "./routes/campaigns_new.js";
import couponRoutes from "./routes/coupons_new.js";
import redemptionRoutes from "./routes/redemptions_new.js";
import reportRoutes from "./routes/reports_new.js";
import distributionRoutes from "./routes/distribution.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// DB Connection Test
pool.getConnection()
  .then((conn) => {
    console.log("✅ Connected to MySQL Database (VCDS)");
    conn.release();
  })
  .catch(err => console.error("❌ DB Connection Failed:", err));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Virtual Coupon Distribution System API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      campaigns: "/api/campaigns",
      coupons: "/api/coupons",
      redemptions: "/api/redemptions",
      reports: "/api/reports",
      distribution: "/api/distribution"
    }
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

// API Routes
app.use("/api/auth", authRoutes);                    // Authentication
app.use("/api/users", userRoutes);                   // User management (Admin)
app.use("/api/campaigns", campaignRoutes);           // EPIC 1: Campaign Management
app.use("/api/coupons", couponRoutes);              // EPIC 2: Coupon Generation
app.use("/api/redemptions", redemptionRoutes);      // EPIC 4: Redemption & Fraud
app.use("/api/reports", reportRoutes);              // EPIC 5: Reports & Analytics
app.use("/api/distribution", distributionRoutes);   // EPIC 3: Distribution

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
// Use 5001 as the default to avoid conflicts with macOS services on 5000
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 VCDS Backend Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
