import express from "express"
import path from "path";
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import cloudinary, { connectCloudinary } from "./config/cloudinary.js";

import appointmentRoutes from "./routes/AppointmentRoute.js";
import userRoutes from "./routes/userRoute.js";
import adminRoute from './routes/adminRoute.js';
import courseRoutes from "./routes/courseRoute.js";
import { configDotenv } from "dotenv"
import consultantRoutes from "./routes/consultantRoutes.js";
import communityRoutes from "./routes/CommunityPost.js";

configDotenv();

const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary();

const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // ✅ allow custom header used by your frontend
  allowedHeaders: ["Content-Type", "Authorization", "x-user-name"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

// Serve uploaded images
// (points to backend/uploads so files from multer like "/uploads/<file>" load in the UI)
app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));

// routes
app.use("/appointments", appointmentRoutes);
app.use("/consultants", consultantRoutes);
app.use("/users", userRoutes);
app.use('/api/admin', adminRoute);
app.use("/courses", courseRoutes); 
app.use("/community", communityRoutes);

// api endpoints
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// ---------- Global error handler (nice to have) ----------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err?.message || "Server error" });
});

// Start server
app.listen(port, () => console.log("🚀 Server is running on port: ", port))
