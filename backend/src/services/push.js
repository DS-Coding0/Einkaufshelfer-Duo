const { messaging } = require('../firebase');
const pool = require('../db');

async function sendToListMembers(listId, title, body, excludeUserId) {
    const result = await pool.query(
        `SELECT DISTINCT u.fcm_token
         FROM users u
         JOIN list_members m ON m.user_id = u.id
         WHERE m.list_id = $1
           AND u.id != $2
           AND u.fcm_token IS NOT NULL
           AND u.fcm_token <> ''`,
        [listId, excludeUserId]
    );

    const tokens = result.rows.map(row => row.fcm_token);

    console.log(`FCM: ${tokens.length} Empfänger für Liste ${listId}`);

    await Promise.all(
        tokens.map(async token => {
            try {
                const messageId = await messaging.send({
                    token,
                    notification: {
                        title,
                        body
                    }
                });

                console.log('FCM: Nachricht angenommen:', messageId);
            } catch (err) {
                console.error(
                    'FCM: Versand fehlgeschlagen:',
                    err.code,
                    err.message
                );
            }
        })
    );
}

module.exports = { sendToListMembers };