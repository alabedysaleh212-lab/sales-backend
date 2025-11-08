// server.js (النسخة النهائية والكاملة لـ MySQL مع دعم الصور)
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- إعداد رفع الصور ---
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- إعداد الاتصال بقاعدة البيانات ---
const db = mysql.createConnection({
    host: "localhost", user: "root", password: "", database: "public_force_db",
});
db.connect((err) => {
    if (err) console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err);
    else console.log("✅ تم الاتصال بقاعدة البيانات بنجاح!");
});

// --- نقاط API ---
app.post("/api/employees", upload.single("photo"), (req, res) => {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.filename;

    const filteredData = {};
    Object.keys(data).forEach(key => { if (data[key]) filteredData[key] = data[key]; });

    const columns = Object.keys(filteredData).join(', ');
    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
    const values = Object.values(filteredData);

    if (columns.length === 0) return res.status(400).json({ error: "لا توجد بيانات للحفظ" });

    const sql = `INSERT INTO employees (${columns}) VALUES (${placeholders})`;
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ خطأ في إضافة البيانات:", err);
            return res.status(500).json({ error: "حدث خطأ أثناء الحفظ" });
        }
        res.json({ success: true, message: "✅ تم حفظ البيانات والصورة بنجاح!", id: result.insertId });
    });
});

app.get("/api/employees", (req, res) => {
    db.query("SELECT * FROM employees ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "حدث خطأ أثناء الجلب" });
        res.json(results);
    });
});
// -----------------

// --- تشغيل الخادم ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));