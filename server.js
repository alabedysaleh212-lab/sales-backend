// server.js (النسخة النهائية لـ Vercel)
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- إعداد الاتصال بقاعدة البيانات (من متغيرات البيئة) ---
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: true // Vercel يتطلب اتصال آمن
    }
};
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) console.error("❌ خطأ فادح في الاتصال بقاعدة البيانات:", err);
    else console.log("✅ تم الاتصال بقاعدة البيانات بنجاح!");
});
// ---------------------------------

// --- نقاط API ---
app.post("/api/employees", (req, res) => {
    const data = { ...req.body };
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO employees (${columns}) VALUES (${placeholders})`;
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: "حدث خطأ أثناء الحفظ" });
        res.json({ success: true, message: "✅ تم حفظ البيانات بنجاح!" });
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
// -------------------