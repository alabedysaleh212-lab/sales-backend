const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../db");

// إعداد رفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================================
//   POST /api/requests    حفظ الطلب
// ================================
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const photoName = req.file ? req.file.filename : null;

    const {
      full_name,
      national_id,
      phone,
      branch,
      rank_title,
      military_number,
      mother_name,
      birth_date,
      birth_place,
      city,
      nearest_point,
      marital_status,
    } = req.body;

    const result = await db.query(
      `INSERT INTO employee_requests 
      (full_name, national_id, phone, branch, rank_title, military_number,
       mother_name, birth_date, birth_place, city, nearest_point, marital_status, photo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        full_name,
        national_id,
        phone,
        branch,
        rank_title,
        military_number,
        mother_name,
        birth_date,
        birth_place,
        city,
        nearest_point,
        marital_status,
        photoName,
      ]
    );

    res.json({
      success: true,
      id: result.rows[0].id,
      message: "تم استلام البيانات بنجاح",
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "خطأ في حفظ الطلب" });
  }
});

module.exports = router;
