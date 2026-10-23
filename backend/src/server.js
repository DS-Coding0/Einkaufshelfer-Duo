const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const { initSocket } = require('./sockets');

const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/lists');
const itemRoutes = require('./routes/items');
const fcmRoutes = require('./routes/fcm');
const inviteRoutes = require('./routes/invite')

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api', itemRoutes);
app.use('/api/fcm', fcmRoutes);
app.use('/api/invite', inviteRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initSocket(server);

server.listen(config.port, () => {
  console.log(`Einkaufshelfer Duo Backend läuft auf Port ${config.port}`);
});