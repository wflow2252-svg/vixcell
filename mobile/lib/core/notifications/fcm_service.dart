import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Background message handler (top-level function required)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📩 [FCM] Background message: ${message.messageId}');
}

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Request permissions (iOS)
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Get FCM token
    final token = await _messaging.getToken();
    debugPrint('📱 [FCM] Token: $token');

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📩 [FCM] Foreground message: ${message.notification?.title}');
      // Local notification display handled by app
    });

    // Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('👆 [FCM] Notification tapped: ${message.data}');
      _handleNotificationNavigation(message.data);
    });

    // Handle notification tap when app was terminated
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationNavigation(initialMessage.data);
    }
  }

  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  static void _handleNotificationNavigation(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    switch (type) {
      case 'chat':
        // Navigate to chat session
        debugPrint('Navigate to chat: ${data['sessionId']}');
        break;
      case 'demo':
        // Navigate to AI demos
        debugPrint('Navigate to demo: ${data['demoId']}');
        break;
      case 'project':
        // Navigate to projects
        debugPrint('Navigate to project: ${data['projectId']}');
        break;
    }
  }

  static void onTokenRefresh(Function(String) callback) {
    _messaging.onTokenRefresh.listen(callback);
  }
}

final fcmServiceProvider = Provider<FcmService>((ref) => FcmService());
