require('dotenv').config();
console.log("🔥 تم تشغيل هذا الملف بنجاح — هذا هو السيرفر الصحيح");

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// --- رفع الصور ---
const upload = multer({ storage: multer.memoryStorage() });

// --- دالة إصلاح التواريخ ---
function fixDate(value) {
  if (!value || value === "" || value === "null" || value === "undefined")
    return null;

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return value;
}

// --- إعداد قاعدة البيانات PostgreSQL ---
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'postgres',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  max: 10,
  idleTimeoutMillis: 30000
});

/* ======================================================
   🆕 PUBLIC SUBMISSIONS — استقبال بيانات النموذج العام
   ====================================================== */
app.post(
  "/api/public-submissions",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  async (req, res) => {
    try {
      const fields = req.body;
      const fileObj = req.files?.photo?.[0] || null;

      const photoBuffer = fileObj ? fileObj.buffer : null;

      const sql = `
        INSERT INTO public.public_submissions (
          branch,
          full_name,
          national_id,
          military_number,
          mother_name,
          birth_date,
          birth_place,
          marital_status,
          phone,
          city,
          nearest_point,
          photo
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id;
      `;

      const values = [
        fields.branch || null,
        fields.full_name || null,
        fields.national_id || null,
        fields.military_number || null,
        fields.mother_name || null,
        fixDate(fields.birth_date),
        fields.birth_place || null,
        fields.marital_status || null,
        fields.phone || null,
        fields.city || null,
        fields.nearest_point || null,
        photoBuffer
      ];

      const result = await pool.query(sql, values);

      res.status(201).json({
        message: "✔ تم استلام بياناتك وسيتم مراجعتها من الإدارة",
        id: result.rows[0].id
      });

    } catch (err) {
      console.error("PUBLIC SUBMISSION ERROR:", err);
      res.status(500).json({ error: "❌ فشل في حفظ الطلب" });
    }
  }
);

/* ======================================================
   GET ALL EMPLOYEES
   ====================================================== */
app.get('/api/employees', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, full_name, military_number, rank_title, branch
      FROM public.employees
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل جلب البيانات' });
  }
});

/* ======================================================
   SEARCH
   ====================================================== */
app.get('/api/employees/search', async (req, res) => {
  try {
    let { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "يرجى إدخال كلمة للبحث" });
    }

    const searchText = `%${query.trim()}%`;

    const sql = `
      SELECT *
      FROM public.employees
      WHERE 
        full_name ILIKE $1 OR
        military_number ILIKE $1 OR
        national_id ILIKE $1 OR
        rank_title ILIKE $1 OR
        branch ILIKE $1
      ORDER BY id DESC
    `;

    const { rows } = await pool.query(sql, [searchText]);
    res.json(rows);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: "فشل جلب البيانات" });
  }
});

/* ======================================================
   GET EMPLOYEE BY ID
   ====================================================== */
app.get('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "رقم غير صالح" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM public.employees WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "غير موجود" });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل جلب البيانات' });
  }
});

/* ======================================================
   ADD EMPLOYEE
   ====================================================== */
app.post(
  '/api/employees',
  upload.fields([{ name: 'photo', maxCount: 1 }]),
  async (req, res) => {
    try {
      const fields = req.body;
      const fileObj = req.files?.photo?.[0] || null;
      const photoBuffer = fileObj ? fileObj.buffer : null;

      const sql = `
        INSERT INTO public.employees (
          branch, full_name, military_number, rank_title,
          national_id, classification, phone, bank, account_number,
          marital_status, insurance_number, mother_name, birth_date,
          birth_place, city, nearest_point, education,
          scientific_specialty, assign_unit, assign_date,
          secondment_unit, secondment_date, secondment_end_date,
          blood_type, id_card_number, passport_number, job_assigned,
          current_affiliation, previous_affiliation, assigned_rank,
          last_promotion_date, degree, promotion_type,
          promotion_decision_number, photo
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
          $31,$32,$33,$34,$35
        )
        RETURNING id;
      `;

      const values = [
        fields.branch || null,
        fields.full_name || null,
        fields.military_number || null,
        fields.rank_title || null,
        fields.national_id || null,
        fields.classification || null,
        fields.phone || null,
        fields.bank || null,
        fields.account_number || null,
        fields.marital_status || null,
        fields.insurance_number || null,
        fields.mother_name || null,
        fixDate(fields.birth_date),
        fields.birth_place || null,
        fields.city || null,
        fields.nearest_point || null,
        fields.education || null,
        fields.scientific_specialty || null,
        fields.assign_unit || null,
        fixDate(fields.assign_date),
        fields.secondment_unit || null,
        fixDate(fields.secondment_date),
        fixDate(fields.secondment_end_date),
        fields.blood_type || null,
        fields.id_card_number || null,
        fields.passport_number || null,
        fields.job_assigned || null,
        fields.current_affiliation || null,
        fields.previous_affiliation || null,
        fields.assigned_rank || null,
        fixDate(fields.last_promotion_date),
        fields.degree || null,
        fields.promotion_type || null,
        fields.promotion_decision_number || null,
        photoBuffer
      ];

      const result = await pool.query(sql, values);
      res.status(201).json({ message: "تم الحفظ", id: result.rows[0].id });

    } catch (err) {
      console.error("POST ERROR:", err);
      res.status(500).json({ error: 'فشل الإدخال' });
    }
  }
);

/* ======================================================
   UPDATE EMPLOYEE
   ====================================================== */
app.put(
  '/api/employees/:id',
  upload.fields([{ name: 'photo', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({ error: "رقم غير صالح" });
      }

      const fields = req.body;
      const fileObj = req.files?.photo?.[0] || null;
      const photoBuffer = fileObj ? fileObj.buffer : null;

      const sql = `
        UPDATE public.employees SET
          branch=$1, full_name=$2, military_number=$3, rank_title=$4,
          national_id=$5, classification=$6, phone=$7, bank=$8,
          account_number=$9, marital_status=$10, insurance_number=$11,
          mother_name=$12, birth_date=$13, birth_place=$14, city=$15,
          nearest_point=$16, education=$17, scientific_specialty=$18,
          assign_unit=$19, assign_date=$20, secondment_unit=$21,
          secondment_date=$22, secondment_end_date=$23, blood_type=$24,
          id_card_number=$25, passport_number=$26, job_assigned=$27,
          current_affiliation=$28, previous_affiliation=$29, assigned_rank=$30,
          last_promotion_date=$31, degree=$32, promotion_type=$33,
          promotion_decision_number=$34,
          photo = COALESCE($35, photo)
        WHERE id=$36
        RETURNING *;
      `;

      const values = [
        fields.branch || null,
        fields.full_name || null,
        fields.military_number || null,
        fields.rank_title || null,
        fields.national_id || null,
        fields.classification || null,
        fields.phone || null,
        fields.bank || null,
        fields.account_number || null,
        fields.marital_status || null,
        fields.insurance_number || null,
        fields.mother_name || null,
        fixDate(fields.birth_date),
        fields.birth_place || null,
        fields.city || null,
        fields.nearest_point || null,
        fields.education || null,
        fields.scientific_specialty || null,
        fields.assign_unit || null,
        fixDate(fields.assign_date),
        fixDate(fields.secondment_date),
        fixDate(fields.secondment_end_date),
        fields.blood_type || null,
        fields.id_card_number || null,
        fields.passport_number || null,
        fields.job_assigned || null,
        fields.current_affiliation || null,
        fields.previous_affiliation || null,
        fields.assigned_rank || null,
        fixDate(fields.last_promotion_date),
        fields.degree || null,
        fields.promotion_type || null,
        fields.promotion_decision_number || null,
        photoBuffer,
        id
      ];

      const result = await pool.query(sql, values);
      res.json({ message: "تم التعديل بنجاح", employee: result.rows[0] });

    } catch (err) {
      console.error("UPDATE ERROR:", err);
      res.status(500).json({ error: 'فشل التعديل' });
    }
  }
);

/* ======================================================
   DELETE EMPLOYEE
   ====================================================== */
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "رقم غير صالح" });
    }

    await pool.query(`DELETE FROM public.employees WHERE id=$1`, [id]);
    res.json({ message: "تم الحذف بنجاح" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: 'فشل الحذف' });
  }
});

/* ====================================================== */
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
