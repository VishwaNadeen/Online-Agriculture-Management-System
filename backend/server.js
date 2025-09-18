import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import appointmentRoutes from "./routes/AppointmentRoute.js";
import userRoutes from "./routes/userRoute.js";
import courseRouter from "./routes/courseRoter.js";

const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

// middlewares
app.use(express.json());
app.use(cors());
app.use(express.json());


// routes
app.use("/appointments", appointmentRoutes);
app.use("/users", userRoutes);
app.use("/courses", courseRouter);

// api endpoints
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// Start server
app.listen(port, () => console.log("🚀 Server is running on port: ",port))