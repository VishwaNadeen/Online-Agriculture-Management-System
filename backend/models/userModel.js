// models/user.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/* ---------- Small reusable sub-schemas ---------- */
const addressSchema = new Schema(
  {
    country: String,
    stateProvince: String, // State / Province
    city: String,
    postalCode: String,
    line1: String,
    line2: String,
  },
  { _id: false }
);

const latLngSchema = new Schema(
  {
    lat: Number, // -90..90
    lng: Number, // -180..180
  },
  { _id: false }
);

/* ---------- Main User schema (single collection) ---------- */
const userSchema = new Schema(
  {
    // ===== All Users (compulsory) =====
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    phone:       { type: String, required: true, unique: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    dateOfBirth: { type: Date,   required: true },
    gender:      { type: String, required: true },    // e.g., "Male", "Female", "Other"
    profilePicture: String,                           // URL
    // Store a HASH here (bcrypt/argon2) — do not store plain text
    password:    { type: String, required: true },

    address: { type: addressSchema, required: true }, // Country/State/City/Postal/Line1/Line2

    // Simple role flag to know which extra section to use
    role: { type: String, enum: ["farmer", "consultant", "user"], default: "user" },

    // ===== Farmer-only (optional; set when role === "farmer") =====
    farmer: {
      farmName: String,
      farmType: String,                 // e.g., Organic, Conventional, Hydroponic
      farmSize: Number,                 // numeric size value
      farmSizeUnit: { type: String, enum: ["perches", "acres", "hectares"] },
      farmAddress: addressSchema,       // Country/Province/City/Village via line1/line2
      farmLocation: latLngSchema,       // pick on map; store lat/lng

      experienceYears: Number,          // Years of Farming Experience
      primaryIrrigationMethod: String,  // Drip, Sprinkler, Flood, Rain-fed
      waterSource: String,              // River, Well, Rainwater Harvesting
      fertilizerPractices: String,      // Organic, Chemical, Mixed
      pesticideUsage: String,           // None, Minimal, Conventional
      soilType: String,                 // Loamy, Sandy, Clay, etc.
      sustainabilityPractices: [String],     // Crop Rotation, Composting, ...
      preferredConsultationTopics: [String], // Pest Control, Fertilizer Planning, ...
      emergencyContact: String,              // simplest: "Name - 07XXXXXXXX"
    },

    // ===== Agri-Consultant-only (optional; set when role === "consultant") =====
    consultant: {
      primarySpecialization: String,     // Soil Science, Pest Management, ...
      secondaryExpertise: [String],      // tags / multi-select
      yearsOfExperience: Number,
      highestQualification: String,      // B.Sc., M.Sc., PhD, ...
      certifications: [String],          // Agronomist License, GAP Auditor, ...
      organizationName: String,

      consultationTypes: [String],       // On-site Visits, Online Advice, Workshops
      feeStructure: String,              // Hourly, Per Visit, Negotiable
      availableServices: [String],       // Pest Diagnosis, Soil Testing, Crop Planning, ...
      serviceRegions: [String],          // Country, Provinces, districts...
      coverageRadiusKm: Number,          // if using GPS radius

      availableDays: [String],           // ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
      availableTimeSlots: [String],      // ["morning","afternoon","evening"]
      noticePeriod: String,              // "24 hours", "48 hours"

      languages: [String],               // ["English","Sinhala","Tamil"]
      bio: String,
      socialLinks: [String],             // URLs
    },
  },
  {
    timestamps: true, // gives createdAt (your "Created Date") and updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password; // hide password hash in API responses
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Optional: expose "createdDate" as an alias to createdAt (read-only)
userSchema.virtual("createdDate").get(function () {
  return this.createdAt;
});

// Quick text search convenience (optional)
userSchema.index({ firstName: "text", lastName: "text", email: "text", phone: "text" });

const User = mongoose.model("User", userSchema);
export default User;