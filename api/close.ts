import express from "express";
import { conn } from "../db";
import { Request, Response } from 'express';
export const router = express.Router();

// Admin close review.
router.put("/review/visibility", (req: Request, res: Response): void => {
  const { reviewID } = req.body;

  if (!reviewID) {
    res.status(400).json({
      status: false,
      message: "ข้อมูลไม่ครบ",
    });
    return;
  }

  const sql = `
    UPDATE review
    SET showpost = 0
    WHERE pid = ?
  `;

  conn.query(sql, [reviewID], (err, result: any) => {
    if (err) {
      res.status(500).json({ status: false, message: "เกิดข้อผิดพลาด!" });
      return;
    }

    res.status(200).json({
      status: true,
      message: "ปิดรีวิวสำเร็จ",
    });
  });
});
