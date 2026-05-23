const admin = require('firebase-admin');

exports.notifyAdmins = async (title, body, data = {}) => {
  try {
    const payload = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      topic: 'admins' // Send to the 'admins' topic
    };

    if (admin.apps.length > 0) {
      await admin.messaging().send(payload);
      console.log('FCM Notification sent to admins');
    } else {
      console.log('Firebase not initialized. Mock sending FCM:', title);
    }
  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
};
