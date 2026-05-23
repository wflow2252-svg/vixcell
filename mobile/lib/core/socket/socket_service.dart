import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/api_endpoints.dart';

class SocketService {
  io.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect(String token) {
    if (_isConnected) return;

    _socket = io.io(
      ApiEndpoints.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      print('✅ [Socket] Connected');
      // Join admin room
      _socket!.emit('admin:join');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      print('🔌 [Socket] Disconnected');
    });

    _socket!.onConnectError((err) {
      print('❌ [Socket] Connection error: $err');
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  // ─── Emit events ───────────────────────────────────────────────────────────
  void sendAdminMessage({
    required String sessionId,
    required String message,
  }) {
    _socket?.emit('admin:message', {
      'sessionId': sessionId,
      'message': message,
    });
  }

  void joinSession(String sessionId) {
    _socket?.emit('admin:join_session', {'sessionId': sessionId});
  }

  void leaveSession(String sessionId) {
    _socket?.emit('admin:leave_session', {'sessionId': sessionId});
  }

  void sendTyping(String sessionId, bool isTyping) {
    _socket?.emit('admin:typing', {
      'sessionId': sessionId,
      'isTyping': isTyping,
    });
  }

  // ─── Listen events ─────────────────────────────────────────────────────────
  void onNewMessage(Function(Map<String, dynamic>) callback) {
    _socket?.on('visitor:message', (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  void onNewSession(Function(Map<String, dynamic>) callback) {
    _socket?.on('session:new', (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  void onNewDemoRequest(Function(Map<String, dynamic>) callback) {
    _socket?.on('demo:new', (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  void onNewProjectRequest(Function(Map<String, dynamic>) callback) {
    _socket?.on('project:new', (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  void onVisitorTyping(Function(Map<String, dynamic>) callback) {
    _socket?.on('visitor:typing', (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  void onSessionClosed(Function(String) callback) {
    _socket?.on('session:closed', (data) {
      callback(data['sessionId'] as String);
    });
  }

  void off(String event) => _socket?.off(event);
}

final socketServiceProvider = Provider<SocketService>((ref) => SocketService());
