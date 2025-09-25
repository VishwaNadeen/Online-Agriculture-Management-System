// backend/routes/consultantRoutes.js
import { Router } from "express";
import User from "../models/userModel.js";

const router = Router();

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
    if (city) match["address.city"] = city;
    if (category) match["consultant.primarySpecialization"] = category;

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
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ];

    const [items, total] = await Promise.all([
      User.aggregate(pipeline).exec(),
      User.countDocuments(match),
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
    }));

    res.json({ total, items: mapped });
  } catch (err) {
    console.error("GET /consultants failed:", err);
    res.status(500).json({ message: "Failed to load consultants" });
  }
});

export default router;
