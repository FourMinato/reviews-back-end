import express from "express";
import { conn } from "../db";

export const router = express.Router();


// All Reports Review.
router.get("/report/review", (req, res) => {
    
    const sql = `SELECT users.name, reports.fk_id, users.uid, reports.date, reports.type
    FROM users, reports
    WHERE users.uid = reports.uid
    AND reports.type = 'review'`;

    conn.query(sql, (err, result) => {
      if (err) {
        console.error("SQL Error:", err);
        return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
      }
      res.json({ status: true, data: result });
    });
});

// All Reports Question.
router.get("/report/question", (req, res) => {
    
    const sql = `SELECT users.name, reports.fk_id, users.uid, reports.date, reports.type
    FROM users, reports
    WHERE users.uid = reports.uid
    AND reports.type = 'question'`;

    conn.query(sql, (err, result) => {
      if (err) {
        console.error("SQL Error:", err);
        return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
      }
      res.json({ status: true, data: result });
    });
});

// All Reports Profile.
router.get("/report/profile", (req, res) => {
    
    const sql = `SELECT users.name, reports.fk_id, users.uid, reports.date, reports.type
    FROM users, reports
    WHERE users.uid = reports.uid
    AND reports.type = 'profile'`;

    conn.query(sql, (err, result) => {
      if (err) {
        console.error("SQL Error:", err);
        return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
      }
      res.json({ status: true, data: result });
    });
});