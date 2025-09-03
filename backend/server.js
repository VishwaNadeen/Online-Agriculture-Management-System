import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import appointmentRoutes from "./routes/AppointmentRoute.js";
import communityRoutes from "./routes/CommunityRoutes.js";

// server.js (or serverr.js)
import "./models/UserModel.js";
import "./models/CommentModel.js";


const app = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

// middlewares
app.use(express.json());
app.use(cors());

//dev only
// Fake user middleware (for testing without auth)
app.use((req, res, next) => {
  req.user = {
    _id: "66f000000000000000000001",  // use a valid ObjectId from your DB
    role: "farmer",
    name: "Test User"
  };
  next();
});

// routes
app.use("/appointments", appointmentRoutes);
app.use("/community", communityRoutes);

// api endpoints
app.get("/", (req, res) => {
  res.status(200).send("Hello from backend server");
});

// Start server
app.listen(port, () => console.log("🚀 Server is running on port: ",port))