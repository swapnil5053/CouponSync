import express from "express";
import pool from "../db.js";
const router = express.Router();

router.get("/merchant/:id", async (req, res) => {
  const merchantId = req.params.id;
  const [rows] = await pool.query(
    `SELECT c.id AS campaign_id,
            COUNT(cp.id) AS total_coupons,
            SUM(cp.redeemed) AS redeemed_coupons
     FROM campaigns c
     LEFT JOIN coupons cp ON c.id = cp.campaign_id
     WHERE c.merchant_id = ?
     GROUP BY c.id
     ORDER BY c.id DESC`,
    [merchantId]
  );
  res.json(rows);
});

export default router;
