import express from "express";
import { conn } from "../db";
import { UsersPostRequest } from "../request/userReq";
import mysql from "mysql2";
import { Router, Request, Response } from 'express';
export const router = express.Router();
import bcrypt from "bcrypt";

//Web REgister.
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, anonymous_name, type } = req.body;


  if (!name || !email || !password) {
    res.status(400).json({ status: false, message: "กรุณากรอกข้อมูลให้ครบ" });
    return;
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const defaultProfile = "1e346a4b-7fb4-4f94-929d-9093df91ce85.jpg";

    conn.query("SELECT * FROM users WHERE email = ?", [email], (err, results: any) => {
      if (err) return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
      if (results.length > 0) return res.json({ status: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });

      const sql = `INSERT INTO users (name, email, password, anonymous_name, profile, type) VALUES (?, ?, ?, ?, ?, ?)`;
      conn.query(sql, [name, email, hashedPassword, anonymous_name, defaultProfile, type], (err, result: any) => {
        if (err) return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดในการสมัคร" });
        res.json({ status: true, message: "สมัครสมาชิกสำเร็จ", userId: result.insertId });
      });
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Hash error" });
  }
});

//Web Login.
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password, captcha } = req.body;
  if (!email || !password) {
    res.status(400).json({ status: false, message: "กรุณาใส่ข้อมูลให้ครบ!" });
    return;
  }
  if (!captcha) {
    res.json({ status: false, message: "โปรดยืนยันตัวตนด้วย reCAPTCHA" });
    return;
  }
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.reCaptchaSecret}&response=${captcha}`;
  const captchaResponse = await fetch(verifyURL).then(r => r.json());
  if (!captchaResponse.success) {
    res.json({ status: false, message: "reCAPTCHA ไม่ถูกต้อง" });
    return;
  }
  const checkUser = "SELECT uid, type, password FROM users WHERE email=?";
  conn.query(checkUser, [email], async (err, result: any) => {
    if (err) return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });

    if (result.length === 0) {
      return res.json({ status: false, message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    try {
      const match = await bcrypt.compare(password, result[0].password);
      if (match) {
        res.status(200).json({
          status: true,
          message: "เข้าสู่ระบบสำเร็จ!",
          uid: result[0].uid,
          type: result[0].type,
        });
      } else {
        res.json({ status: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง!" });
      }
    } catch (e) {
      res.status(500).json({ status: false, message: "Error comparing password" });
    }
  });
});


// Get other user uid, name, profile.
router.get("/getuser/:uid", (req, res) => {
  const uid = req.params.uid;
  const sql = `SELECT uid, name, email, profile FROM users WHERE uid = ?`;
  conn.query(sql, [uid], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
    }
    if (result.length === 0) {
      return res.status(200).json({ status: true, data: [], message: "ไม่พบผู้ใช้" });
    }
    res.json({ status: true, data: result });
  });
});

// Get other user Reviews.
router.get("/getuser/review/:uid", (req, res) => {
    const uid = req.params.uid;
    const sql = `
        SELECT review.pid, subject.subcode, review.date, review.is_anonymous
        FROM review
        JOIN subject ON review.sid = subject.subid
        WHERE review.uid = ? 
        AND review.showpost = 1
        ORDER BY review.date DESC
    `;

    conn.query(sql, [uid], (err, result) => {
        if (err) return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
        res.json({ status: true, data: result });
      });
});

// Get other user Questions.
router.get("/getuser/question/:uid", (req, res) => {
  const uid = req.params.uid;
  const sql = `SELECT question.id, question.date
      FROM question
      WHERE question.uid = ?
      AND question.open = 1
      ORDER BY question.date DESC`;
  conn.query(sql, [uid], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด" });
    }
    if (result.length === 0) {
      return res.status(200).json({ status: true, data: [], message: "ผู้ใช้คนนี้ไม่เคยโพสต์คำถาม" });
    }
    res.json({ status: true, data: result });
  });
});




