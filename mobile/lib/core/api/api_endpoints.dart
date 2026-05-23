class ApiEndpoints {
  // Change this to your production URL when deploying
  static const String baseUrl = 'http://10.0.2.2:3001/api';
  // For physical device on same network, use your PC's local IP:
  // static const String baseUrl = 'http://192.168.x.x:3001/api';

  // Auth
  static const String login   = '/auth/login';
  static const String logout  = '/auth/logout';
  static const String refresh = '/auth/refresh';

  // Chat
  static const String chatSessions = '/chat/sessions';
  static const String chatMessages = '/chat/sessions/{id}/messages';

  // AI Demos
  static const String aiDemos    = '/ai/demos';
  static const String generateDemo = '/ai/generate-demo';

  // Projects
  static const String projects = '/projects';

  // Support
  static const String support = '/support';

  // Stats
  static const String stats = '/stats';

  // Socket.io
  static const String socketUrl = 'http://10.0.2.2:3001';
}
