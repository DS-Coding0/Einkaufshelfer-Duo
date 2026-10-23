const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth)


// Beim Erstellen einer Liste (POST /lists)
function generateInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

router.post('/', auth, async (req, res) => {
    const list = new List({
        name: req.body.name,
        owner: req.user.id,
        inviteCode: generateInviteCode()  // ← hier
    });
    await list.save();
    res.status(201).json(list);
});