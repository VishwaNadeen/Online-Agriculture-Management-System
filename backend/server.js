import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"

import appointmentRoutes from "./routes/AppointmentRoute.js";
import userRoutes from "./routes/userRoute.js";
import adminRoute from './routes/adminRoute.js';
import courseRouter from "./routes/courseRoter.js";

const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // your React dev URL
  credentials: true,               // allow cookies
}));
app.use(express.json());

// routes
app.use("/appointments", appointmentRoutes);
app.use("/users", userRoutes);
app.use('/api/admin', adminRoute);
app.use("/courses", courseRouter);

// api endpoints
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// Start server
app.listen(port, () => console.log("🚀 Server is running on port: ",port))