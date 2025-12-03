// routes/publicPersonnel.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // اتصال PostgreSQL
const multer = require("multer");

// رفع الصورة
const upload = multer({ dest: "uploads/" });

// استقبال البيانات من النموذج العام
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const {
      full_name,
      rank,
      branch,
      national_id,
      phone,
      // ... بقية الحقول
    } = req.body;

    // مثال على التحقق البسيط
    if (!full_name || !national_id) {
      return res.status(400).json({ message: "الاسم والرقم الوطني إجباريان" });
    }

    const photoPath = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO personnel 
       (full_name, rank, branch, national_id, phone, photo_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [full_name, rank, branch, national_id, phone, photoPath, "pending"]
    );

    res.status(201).json({
      message: "تم استلام بياناتك بنجاح، سيتم مراجعتها.",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
});

module.exports = router;
