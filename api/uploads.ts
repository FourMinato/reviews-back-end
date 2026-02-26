import express from 'express';
import multer from 'multer';
import path from 'path';
import { conn } from '../db'; // เช็ค path ของไฟล์ db ของคุณให้ถูกต้องด้วยนะครับ

export const router = express.Router();

// ตั้งค่าที่เก็บไฟล์และชื่อไฟล์ (Multer Config)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 1. เปลี่ยนเป้าหมายเป็นโฟลเดอร์ย่อย
    cb(null, 'uploads/user-profile/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// สร้าง API เส้นทางสำหรับอัปโหลดรูปโปรไฟล์
// ตอนเรียกใช้จาก Angular จะเป็น /uploads/profile/ตัวเลขuid
router.post('/profile/:uid', upload.single('profileImage'), (req: any, res: any) => {
  const uid = req.params.uid;
  
  if (!req.file) {
    return res.status(400).json({ status: false, message: 'ไม่มีไฟล์ถูกอัปโหลด' });
  }

  const fileName = req.file.filename;

  // นำชื่อไฟล์ใหม่ไปอัปเดตลงในฐานข้อมูล
  const sql = "UPDATE users SET profile = ? WHERE uid = ?";
  conn.query(sql, [fileName, uid], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ status: false, message: 'เกิดข้อผิดพลาดที่ฐานข้อมูล' });
    }
    
    // ส่งกลับไปบอกหน้าบ้านว่าอัปโหลดเสร็จแล้ว
    res.json({ status: true, message: 'อัปโหลดสำเร็จ', fileName: fileName });
  });
});