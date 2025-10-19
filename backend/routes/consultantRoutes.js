// backend/routes/consultantRoutes.js
import { Router } from "express";
import User from "../models/userModel.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /consultants
 * Query: ?city=Kandy&category=Soil%20Testing&q=ruwan&limit=12&page=1
 * Returns only safe/light fields for the cards.
 */
router.get("/", async (req, res) => {
  try {
    const {
      city = "",
      category = "",              // maps to consultant.primarySpecialization
      q = "",
      limit = "12",
      page = "1",
    } = req.query;

    const match = { role: "consultant" };
    if (city) match["address.city"] = new RegExp(`^${escapeRegExp(city)}$`, "i");

    const categoryFilter = category
      ? {
          $or: [
            { "consultant.primarySpecialization": { $regex: new RegExp(`^${escapeRegExp(category)}$`, "i") } },
            { "consultant.secondaryExpertise": { $regex: new RegExp(escapeRegExp(category), "i") } },
          ],
        }
      : null;

    const textOrName =
      q?.trim()
        ? {
            $or: [
              { firstName: new RegExp(q.trim(), "i") },
              { lastName: new RegExp(q.trim(), "i") },
              { email: new RegExp(q.trim(), "i") },
            ],
          }
        : null;

    const pipeline = [
      { $match: match },
      ...(categoryFilter ? [{ $match: categoryFilter }] : []),
      ...(textOrName ? [{ $match: textOrName }] : []),
      {
        $project: {
          // card fields only
          firstName: 1,
          lastName: 1,
          "address.city": 1,
          "consultant.primarySpecialization": 1,
          "consultant.secondaryExpertise": 1,
          "consultant.yearsOfExperience": 1,
          "consultant.languages": 1,
          "consultant.feeStructure": 1,
          "consultant.availableTimeSlots": 1,
          "consultant.bio": 1,
          profilePicture: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    const [items, total] = await Promise.all([
      User.aggregate(pipeline).exec(),
      (async () => {
        const countPipeline = [
          { $match: match },
          ...(categoryFilter ? [{ $match: categoryFilter }] : []),
          ...(textOrName ? [{ $match: textOrName }] : []),
          { $count: "n" },
        ];
        const r = await User.aggregate(countPipeline).exec();
        return r?.[0]?.n || 0;
      })(),
    ]);

    const mapped = items.map((u) => ({
      id: String(u._id),
      name: `${u.firstName} ${u.lastName}`,
      city: u.address?.city || "-",
      category: u.consultant?.primarySpecialization || "Consultation",
      yearsExp: u.consultant?.yearsOfExperience || 0,
      languages: u.consultant?.languages || [],
      fee: u.consultant?.feeStructure || "Negotiable",
      about: u.consultant?.bio || "",
      specializations: u.consultant?.secondaryExpertise || [],
      slots: u.consultant?.availableTimeSlots || [],
      profilePicture: u.profilePicture || null,
    }));

    res.json({ total, items: mapped });
  } catch (err) {
    console.error("GET /consultants failed:", err);
    res.status(500).json({ message: "Failed to load consultants" });
  }
});

/**
 * GET /consultants/:id
 * Returns full public consultant profile by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const u = await User.findById(id).lean();
    
    if (!u || u.role !== "consultant") {
      return res.status(404).json({ message: "Consultant not found" });
    }

    const profile = {
      id: String(u._id),
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      profilePicture: u.profilePicture || null,
      dateOfBirth: u.dateOfBirth,
      gender: u.gender,
      username: u.username,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt,
      address: u.address,
      consultant: {
        bio: u.consultant?.bio || "",
        primarySpecialization: u.consultant?.primarySpecialization || "",
        secondaryExpertise: u.consultant?.secondaryExpertise || [],
        yearsOfExperience: u.consultant?.yearsOfExperience || 0,
        highestQualification: u.consultant?.highestQualification || "",
        certifications: u.consultant?.certifications || [],
        organizationName: u.consultant?.organizationName || "",
        consultationTypes: u.consultant?.consultationTypes || [],
        availableServices: u.consultant?.availableServices || [],
        feeStructure: u.consultant?.feeStructure || "",
        serviceRegions: u.consultant?.serviceRegions || [],
        coverageRadiusKm: u.consultant?.coverageRadiusKm || null,
        languages: u.consultant?.languages || [],
        availableDays: u.consultant?.availableDays || [],
        availableTimeSlots: u.consultant?.availableTimeSlots || [],
        noticePeriod: u.consultant?.noticePeriod || "",
        socialLinks: u.consultant?.socialLinks || [],
      },
    };

    res.json(profile);
  } catch (err) {
    console.error("GET /consultants/:id failed:", err);
    res.status(500).json({ message: "Failed to load consultant profile" });
  }
});

/**
 * GET /consultants/me
 * Returns safe consultant profile of the authenticated user
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const u = await User.findById(req.user._id).lean();
    if (!u || u.role !== "consultant") {
      return res.status(404).json({ message: "Consultant profile not found" });
    }
    const me = {
      id: String(u._id),
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      city: u.address?.city || "-",
      specialization: u.consultant?.primarySpecialization || "",
      yearsExp: u.consultant?.yearsOfExperience || 0,
      languages: u.consultant?.languages || [],
      bio: u.consultant?.bio || "",
      availableDays: u.consultant?.availableDays || [],
      availableTimeSlots: u.consultant?.availableTimeSlots || [],
    };
    res.json(me);
  } catch (err) {
    console.error("GET /consultants/me failed:", err);
    res.status(500).json({ message: "Failed to load consultant" });
  }
});

export default router;
