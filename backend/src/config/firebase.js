'use strict';

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initFirebase = () => {
  try {
    // Already initialized
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0];
      return firebaseApp;
    }

    let serviceAccount;

    // Option 1: JSON string in env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    // Option 2: Path to service account file
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const accountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(accountPath)) {
        serviceAccount = require(accountPath);
      }
    }

    if (!serviceAccount) {
      console.warn(
        '⚠️  Firebase: No service account configured. FCM push notifications will be disabled.'
      );
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase init failed:', error.message);
    return null;
  }
};

const getFirebaseAdmin = () => {
  if (!admin.apps.length) return null;
  return admin;
};

module.exports = initFirebase;
module.exports.getFirebaseAdmin = getFirebaseAdmin;
