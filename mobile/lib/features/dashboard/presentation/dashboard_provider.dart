import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

// Fake stats while backend is not connected
final _fallbackStats = {
  'activeChats': 3,
  'totalDemos': 24,
  'newProjects': 5,
  'openTickets': 8,
  'totalRevenue': 48500,
  'conversionRate': 34,
};

final dashboardStatsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final api = ref.read(apiClientProvider);
    final response = await api.get(ApiEndpoints.stats);
    return Map<String, dynamic>.from(response.data['data']);
  } catch (_) {
    // Return fallback data if backend not available
    return _fallbackStats;
  }
});
