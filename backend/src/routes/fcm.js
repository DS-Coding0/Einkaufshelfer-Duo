const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/token', async (req, res) => {
  const { fcmToken } = req.body;
  await pool.query(`UPDATE users SET fcm_token = $1 WHERE id = $2`, [
    fcmToken,
    req.user.userId,
  ]);
  res.json({ ok: true });
});

module.exports = router;