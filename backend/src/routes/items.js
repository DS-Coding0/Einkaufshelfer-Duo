const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { getIo } = require('../sockets');
const { sendToListMembers } = require('../services/push');

const router = express.Router();
router.use(requireAuth);

async function isMember(listId, userId) {
  const r = await pool.query(
    `SELECT 1 FROM list_members WHERE list_id = $1 AND user_id = $2`,
    [listId, userId]
  );
  return r.rows.length > 0;
}

// Artikel einer Liste
router.get('/lists/:listId/items', async (req, res) => {
  const { listId } = req.params;
  if (!(await isMember(listId, req.user.userId)))
    return res.status(403).json({ error: 'Kein Zugriff' });

  const result = await pool.query(
    `SELECT * FROM items WHERE list_id = $1 ORDER BY created_at`,
    [listId]
  );
  res.json(result.rows);
});

// Artikel hinzufügen
router.post('/lists/:listId/items', async (req, res) => {
  const { listId } = req.params;
  const { name, quantity, category } = req.body;
  if (!(await isMember(listId, req.user.userId)))
    return res.status(403).json({ error: 'Kein Zugriff' });

  const result = await pool.query(
    `INSERT INTO items (list_id, name, quantity, category, added_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [listId, name, quantity, category, req.user.userId]
  );

  const item = result.rows[0];
  getIo().to(listId).emit('item:added', { listId, item });
  // Push an alle anderen Mitglieder
  sendToListMembers(
    listId,
    'Neuer Artikel',
    `${item.name} wurde zur Liste hinzugefügt`,
    req.user.userId
  ).catch(err => console.error('Push-Fehler:', err));

  res.status(201).json(item);
});

// Artikel ändern / abhaken
router.patch('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, category, checked } = req.body;

  const existing = await pool.query(`SELECT * FROM items WHERE id = $1`, [id]);
  if (existing.rows.length === 0)
    return res.status(404).json({ error: 'Artikel nicht gefunden' });

  const listId = existing.rows[0].list_id;
  if (!(await isMember(listId, req.user.userId)))
    return res.status(403).json({ error: 'Kein Zugriff' });

  const result = await pool.query(
    `UPDATE items SET
       name = COALESCE($1, name),
       quantity = COALESCE($2, quantity),
       category = COALESCE($3, category),
       checked = COALESCE($4, checked),
       updated_at = now()
     WHERE id = $5 RETURNING *`,
    [name, quantity, category, checked, id]
  );

  const item = result.rows[0];
  getIo().to(listId).emit('item:updated', { listId, item });
  res.json(item);
});

// Artikel löschen
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await pool.query(`SELECT * FROM items WHERE id = $1`, [id]);
  if (existing.rows.length === 0)
    return res.status(404).json({ error: 'Artikel nicht gefunden' });

  const listId = existing.rows[0].list_id;
  if (!(await isMember(listId, req.user.userId)))
    return res.status(403).json({ error: 'Kein Zugriff' });

  await pool.query(`DELETE FROM items WHERE id = $1`, [id]);
  getIo().to(listId).emit('item:deleted', { listId, itemId: id });
  res.status(204).send();
});

module.exports = router;