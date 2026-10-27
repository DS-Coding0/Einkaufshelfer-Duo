const {
    initializeApp,
    cert,
    getApps,
    getApp
} = require('firebase-admin/app');

const { getMessaging } = require('firebase-admin/messaging');

const serviceAccount = require('./firebase-service-account.json');

const app = getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount)
    });

const messaging = getMessaging(app);

module.exports = { messaging };