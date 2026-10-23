const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Meine Listen
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT l.* FROM lists l
     JOIN list_members m ON m.list_id = l.id
     WHERE m.user_id = $1`,
    [req.user.userId]
  );
  res.json(result.rows);
});

// Neue Liste
router.post('/', async (req, res) => {
  const { name } = req.body;
  const inviteCode = crypto.randomBytes(4).toString('hex');

  const result = await pool.query(
    `INSERT INTO lists (name, owner_id, invite_code)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, req.user.userId, inviteCode]
  );

  const list = result.rows[0];
  await pool.query(
    `INSERT INTO list_members (list_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [list.id, req.user.userId]
  );

  res.status(201).json(list);
});

// Per Invite-Code beitreten
router.post('/join', async (req, res) => {
  const { inviteCode } = req.body;
  const result = await pool.query(
    `SELECT id FROM lists WHERE invite_code = $1`,
    [inviteCode]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: 'Liste nicht gefunden' });

  const listId = result.rows[0].id;
  await pool.query(
    `INSERT INTO list_members (list_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [listId, req.user.userId]
  );

  res.json({ listId });
});

module.exports = router;