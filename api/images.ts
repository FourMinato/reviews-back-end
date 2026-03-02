import express from "express";
import { conn } from "../db";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

export const router = express.Router();

class FileMiddleWare {
  public filename = "";
  public diskLoader: multer.Multer;

  constructor(subfolder: string = "") {
    // ใช้ process.cwd() เพื่อชี้จาก Root ของโปรเจกต์
    const targetDir = path.join(process.cwd(), "uploads", subfolder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.diskLoader = multer({
      storage: multer.diskStorage({
        destination: (_req, __file, cb) => {
          cb(null, targetDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = uuidv4();
          this.filename = uniqueSuffix + "." + file.originalname.split(".").pop();
          cb(null, this.filename);
        },
      }),
    });
  }
}

const profileUpload = new FileMiddleWare("user-profile");

// API อัปโหลดและลบรูปเก่า
router.post("/upload-profile/:uid", profileUpload.diskLoader.single('profileImage'), (req, res) => {
  const uid = req.params.uid;
  const newFileName = req.file?.filename;

  if (!newFileName) {
    res.status(400).json({ status: false, message: "ไฟล์ไม่เข้าโฟลเดอร์" });
  } else {
    // 1. หาชื่อไฟล์เก่ามาลบ
    conn.query(`SELECT profile FROM users WHERE uid = ?`, [uid], (err, results: any) => {
      if (results && results.length > 0) {
        const oldFileName = results[0].profile;
        // ไม่ลบถ้าเป็นรูป Default
        if (oldFileName && oldFileName !== '1e346a4b-7fb4-4f94-929d-9093df91ce85.jpg') {
          const oldFilePath = path.join(process.cwd(), "uploads", "user-profile", oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      // 2. อัปเดตชื่อไฟล์ใหม่ลง DB
      conn.query(`UPDATE users SET profile = ? WHERE uid = ?`, [newFileName, uid], (err) => {
        if (err) res.status(500).json({ status: false });
        else res.json({ status: true, fileName: newFileName });
      });
    });
  }
});

// Route สำหรับอ่านไฟล์ (กรณีไม่ใช้ Static ตรงๆ)
router.get("/user-profile/:filename", (req, res) => {
  const filePath = path.join(process.cwd(), "uploads", "user-profile", req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).send("Not Found");
});