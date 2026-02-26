import express from "express";
import { conn } from "../db";
import path, { dirname } from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

export const router = express.Router();

class FileMiddleWare {
  filename = "";
  public diskLoader: multer.Multer;

  // 1. รับชื่อ subfolder เข้ามาทาง Constructor (ถ้าไม่ส่งมาจะใช้ค่าว่าง = ลง uploads ชั้นนอก)
  constructor(subfolder: string = "") {
    // 2. เอา subfolder ไปต่อท้าย path เดิม
    const targetDir = path.join(__dirname, "../uploads", subfolder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.diskLoader = multer({
      storage: multer.diskStorage({
        destination: (_req, __file, cb) => {
          cb(null, targetDir); // ชี้ไปที่โฟลเดอร์ตามเป้าหมาย
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          this.filename = uniqueSuffix + "." + file.originalname.split(".").pop();
          cb(null, this.filename);
        },
      }),
      limits: {
        fileSize: 67108864,
      },
    });
  }
}

// สร้าง Instance ตัวที่ 1: สำหรับรูป Default (ลง uploads/ เฉยๆ)
const defaultUpload = new FileMiddleWare();
// สร้าง Instance ตัวที่ 2: สำหรับรูปที่มีการแก้ไข (ลง uploads/user-profile/)
const profileUpload = new FileMiddleWare("user-profile");


// --- API เดิม (ตอนสมัคร) ---
router.post("/", defaultUpload.diskLoader.single("file"), (req, res) => {
  res.json({ filename: defaultUpload.filename })
});

router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "../uploads", filename));
});


// --- API ใหม่ (ตอนแก้ไขรูปโปรไฟล์) ---

// เส้นทางอัปโหลดและอัปเดตลงฐานข้อมูล
router.post("/upload-profile/:uid", profileUpload.diskLoader.single("profileImage"), (req, res) => {
  const uid = req.params.uid;
  const filename = profileUpload.filename;

  const sql = "UPDATE users SET profile = ? WHERE uid = ?";
  conn.query(sql, [filename, uid], (err, result) => {
    if (err) return res.status(500).json({ status: false, message: "Database Error" });
    res.json({ status: true, message: "เปลี่ยนรูปสำเร็จ", fileName: filename });
  });
});

// เส้นทางสำหรับอ่านไฟล์ที่อยู่ใน user-profile
router.get("/user-profile/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "../uploads/user-profile", filename));
});