const admin = require('firebase-admin');
const pool = require('../db');

let initialized = false;

function init() {
  if (initialized) return;
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON || '{}')
    ),
  });
  initialized = true;
}

async function sendToListMembers(listId, title, body, excludeUserId) {
  init();
  const result = await pool.query(
    `SELECT u.fcm_token FROM users u
     JOIN list_members m ON m.user_id = u.id
     WHERE m.list_id = $1 AND u.id != $2 AND u.fcm_token IS NOT NULL`,
    [listId, excludeUserId]
  );

  const tokens = result.rows.map(r => r.fcm_token);
  if (tokens.length === 0) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
  });
}

module.exports = { sendToListMembers };