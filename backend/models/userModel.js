import mongoose from "mongoose";
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    country: String,
    stateProvince: String,
    city: String,
    postalCode: String,
    line1: String,
    line2: String,
  },
  { _id: false }
);

const latLngSchema = new Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

/*Main User schema*/
const userSchema = new Schema(
  {
    // ===== All Users (compulsory) =====
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    phone:       { type: String, required: true, unique: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    dateOfBirth: { type: Date,   required: true },
    gender:      { type: String, required: true }, 
    profilePicture: String,                           
    
    password:    { type: String, required: true },

    address: { type: addressSchema, required: true }, 

    // ⬇️ Added "admin" here
    role: { type: String, enum: ["farmer", "consultant", "user", "admin"], default: "user" },

    // Farmer-only
    farmer: {
      farmName: String,
      farmType: String,            
      farmSize: Number,                
      farmSizeUnit: { type: String, enum: ["perches", "acres", "hectares"] },
      farmAddress: addressSchema,      
      farmLocation: latLngSchema,

      experienceYears: Number,
      primaryIrrigationMethod: String,
      waterSource: String,
      fertilizerPractices: String,
      pesticideUsage: String, 
      soilType: String,  
      sustainabilityPractices: [String],
      preferredConsultationTopics: [String],
      emergencyContact: String, 
    },

    // Agri-Consultant-only
    consultant: {
      primarySpecialization: String,
      secondaryExpertise: [String],
      yearsOfExperience: Number,
      highestQualification: String, 
      certifications: [String], 
      organizationName: String,

      consultationTypes: [String],
      feeStructure: String,  
      availableServices: [String],
      serviceRegions: [String], 
      coverageRadiusKm: Number, 

      availableDays: [String],  
      availableTimeSlots: [String],  
      noticePeriod: String,  

      languages: [String], 

      
      bio: String,
      socialLinks: [String],
    },
  },
  
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("createdDate").get(function () {
  return this.createdAt;
});

userSchema.index({ firstName: "text", lastName: "text", email: "text", phone: "text" });

const User = mongoose.model("User", userSchema);
export default User;