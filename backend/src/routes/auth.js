const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

const router = express.Router();
const client = new OAuth2Client(config.googleClientId);

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken fehlt' });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();

    const { sub, email, name, picture } = payload;

    const result = await pool.query(
      `INSERT INTO users (google_sub, email, name, picture_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub)
       DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, picture_url = EXCLUDED.picture_url
       RETURNING id, email, name, picture_url`,
      [sub, email, name, picture]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Google-Login fehlgeschlagen' });
  }
});

module.exports = router;