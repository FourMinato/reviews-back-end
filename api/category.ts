import express from "express";
import { conn } from "../db";
import { Request, Response } from 'express';
export const router = express.Router();

// Select All subject where category = ?
router.post("/subject/select", (req: Request, res: Response): void => {
  const { cateids } = req.body;
  if (!Array.isArray(cateids) || cateids.length === 0) {
    res.status(400).json({ status: false, message: "cateids ต้องเป็น array" });
    return;
  }

  const sql = `SELECT s.*,
                (SELECT COUNT(*) FROM review WHERE sid=s.subid AND showpost=1) review_count,
                (SELECT IFNULL(AVG(rate),0) FROM review WHERE sid=s.subid AND showpost=1) avg_rate
                FROM subject s
                WHERE cateid IN (?)
                ORDER BY subcode ASC`;
  conn.query(sql, [cateids], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: false, message: "Database error" });
      return;
    }
    res.json({ status: true, result });
  });
});

// Select All subject where category = ? and order by review amount
router.post("/subject/select/review", (req: Request, res: Response): void => {
  const { cateids } = req.body;

  if (!Array.isArray(cateids) || cateids.length === 0) {
    res.status(400).json({ status: false, message: "cateids ต้องเป็น array" });
    return;
  }

  const sql = `SELECT s.*,
                (SELECT COUNT(*) FROM review WHERE sid=s.subid AND showpost=1) review_count,
                (SELECT IFNULL(AVG(rate),0) FROM review WHERE sid=s.subid AND showpost=1) avg_rate
                FROM subject s
                WHERE cateid IN (?)
                ORDER BY review_count desc`;
  conn.query(sql, [cateids], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: false, message: "Database error" });
      return;
    }
    res.json({ status: true, result });
  });
});

// Select All subject where category = ? and order by rate
router.post("/subject/select/rate", (req: Request, res: Response): void => {
  const { cateids } = req.body;

  if (!Array.isArray(cateids) || cateids.length === 0) {
    res.status(400).json({ status: false, message: "cateids ต้องเป็น array" });
    return;
  }

  const sql = `SELECT s.*,
                (SELECT COUNT(*) FROM review WHERE sid=s.subid AND showpost=1) review_count,
                (SELECT IFNULL(AVG(rate),0) FROM review WHERE sid=s.subid AND showpost=1) avg_rate
                FROM subject s
                WHERE cateid IN (?)
                ORDER BY avg_rate desc`;
  conn.query(sql, [cateids], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: false, message: "Database error" });
      return;
    }
    res.json({ status: true, result });
  });
});