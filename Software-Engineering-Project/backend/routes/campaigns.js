import express from "express";
import pool from "../db.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM campaigns ORDER BY id DESC");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { merchant_id, name, type, discount, start_date, end_date, max_redemptions } = req.body;
  const [result] = await pool.query(
    `INSERT INTO campaigns (merchant_id, name, type, discount, start_date, end_date, max_redemptions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [merchant_id, name, type, discount, start_date, end_date, max_redemptions]
  );
  res.json({ id: result.insertId, message: "Campaign created" });
});

export default router;
