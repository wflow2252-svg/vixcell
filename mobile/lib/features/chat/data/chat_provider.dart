import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

// ─── Demo sessions fallback ───────────────────────────────────────────────────
final _demoSessions = [
  {
    '_id': 'demo-1',
    'visitorName': 'Ahmed Hassan',
    'status': 'open',
    'lastMessage': 'I need a mobile app for my restaurant',
    'unreadCount': 2,
    'createdAt': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
  },
  {
    '_id': 'demo-2',
    'visitorName': 'Sara Ali',
    'status': 'open',
    'lastMessage': 'How long does it take to build a website?',
    'unreadCount': 1,
    'createdAt': DateTime.now().subtract(const Duration(minutes: 23)).toIso8601String(),
  },
  {
    '_id': 'demo-3',
    'visitorName': 'Khaled Omar',
    'status': 'closed',
    'lastMessage': 'Thank you for the information!',
    'unreadCount': 0,
    'createdAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
  },
];

final _demoMessages = {
  'demo-1': [
    {
      '_id': 'm1',
      'sender': 'visitor',
      'content': 'Hello! I need a mobile app for my restaurant',
      'createdAt': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
    },
    {
      '_id': 'm2',
      'sender': 'visitor',
      'content': 'Can you help me? What would be the cost?',
      'createdAt': DateTime.now().subtract(const Duration(minutes: 4)).toIso8601String(),
    },
  ],
  'demo-2': [
    {
      '_id': 'm3',
      'sender': 'visitor',
      'content': 'Hi! How long does it take to build a website?',
      'createdAt': DateTime.now().subtract(const Duration(minutes: 23)).toIso8601String(),
    },
    {
      '_id': 'm4',
      'sender': 'admin',
      'content': 'Hi Sara! It depends on the complexity. A standard website takes 2-4 weeks.',
      'createdAt': DateTime.now().subtract(const Duration(minutes: 20)).toIso8601String(),
    },
  ],
};

// ─── Providers ────────────────────────────────────────────────────────────────
final chatSessionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final api = ref.read(apiClientProvider);
    final response = await api.get(ApiEndpoints.chatSessions);
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return _demoSessions;
  }
});

final chatMessagesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, sessionId) async {
  try {
    final api = ref.read(apiClientProvider);
    final url = ApiEndpoints.chatMessages.replaceAll('{id}', sessionId);
    final response = await api.get(url);
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return _demoMessages[sessionId] ?? [];
  }
});

// ─── Live messages state (for real-time in chat detail) ───────────────────────
class ChatDetailNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  ChatDetailNotifier() : super([]);

  void setMessages(List<Map<String, dynamic>> messages) => state = messages;

  void addMessage(Map<String, dynamic> message) {
    state = [...state, message];
  }
}

final chatDetailProvider =
    StateNotifierProvider.family<ChatDetailNotifier, List<Map<String, dynamic>>, String>(
  (ref, sessionId) => ChatDetailNotifier(),
);
