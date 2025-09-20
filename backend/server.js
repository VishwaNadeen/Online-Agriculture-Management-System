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


configDotenv();


const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// routes
app.use("/appointments", appointmentRoutes);
app.use("/users", userRoutes);
app.use('/api/admin', adminRoute);
app.use("/courses", courseRoutes); 


// api endpoints
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// Start server
app.listen(port, () => console.log("🚀 Server is running on port: ",port))