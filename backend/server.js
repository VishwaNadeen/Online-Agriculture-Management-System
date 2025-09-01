import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import appointmentRoutes from "./routes/AppointmentRoute.js";

const app = express();
const port = process.env.PORT || 5000;

// connect db
await connectDB();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/appointments", appointmentRoutes);

// root
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// start
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
