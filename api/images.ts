import express from "express";
import { conn } from "../db";
import multer from "multer";
import { createClient } from '@supabase/supabase-js';

export const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.post("/upload-profile/:uid", upload.single('profileImage'), async (req, res) => {
  const uid = req.params.uid;
  const file = req.file;

  if (!file) {
    // แก้ไข: ลบ return หน้า res และใช้ return; แยกบรรทัด
    res.status(400).json({ status: false, message: "ไม่พบไฟล์ภาพ" });
    return; 
  }

  try {
    conn.query(`SELECT profile FROM users WHERE uid = ?`, [uid], async (err, results: any) => {
      if (err) {
        res.status(500).json({ status: false, message: "Database Error" });
        return;
      }

      if (results && results.length > 0) {
        const oldUrl = results[0].profile;
        if (oldUrl && oldUrl.includes("supabase.co")) {
          const fileNameOld = oldUrl.split('/').pop();
          if (fileNameOld) {
            await supabase.storage
              .from(process.env.SUPABASE_BUCKET || 'profiles')
              .remove([fileNameOld]);
          }
        }
      }

      const fileExt = file.originalname.split('.').pop();
      const fileName = `profile-${uid}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'profiles')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        res.status(500).json({ status: false, message: "Upload to Storage failed" });
        return;
      }

      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'profiles')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      conn.query(`UPDATE users SET profile = ? WHERE uid = ?`, [publicUrl, uid], (err) => {
        if (err) {
          res.status(500).json({ status: false });
          return;
        }
        res.json({
          status: true,
          message: "อัปโหลดสำเร็จ",
          fileName: publicUrl
        });
      });
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error" });
  }
});