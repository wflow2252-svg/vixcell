import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

final _demoTickets = [
  {
    '_id': 't1',
    'title': 'Bug in FoodFlow payment gateway',
    'clientName': 'Tariq Sultan',
    'priority': 'high',
    'status': 'open',
    'description': 'Payment fails on Safari browser when using Visa card',
    'projectName': 'FoodFlow v2.1',
    'createdAt': DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
  },
  {
    '_id': 't2',
    'title': 'Add dark mode to MedSync',
    'clientName': 'Dr. Nada Ibrahim',
    'priority': 'medium',
    'status': 'in_progress',
    'description': 'Client requesting dark mode feature for the admin dashboard',
    'projectName': 'MedSync v3.0',
    'createdAt': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
  },
  {
    '_id': 't3',
    'title': 'Performance issue on EduLeap video player',
    'clientName': 'EduLeap Team',
    'priority': 'low',
    'status': 'open',
    'description': 'Video player stutters on low-end devices',
    'projectName': 'EduLeap',
    'createdAt': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
  },
];

final supportProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final api = ref.read(apiClientProvider);
    final response = await api.get(ApiEndpoints.support);
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return _demoTickets;
  }
});

class SupportScreen extends ConsumerWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickets = ref.watch(supportProvider);

    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.bgGradient),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentOrange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.support_agent_rounded,
                        color: AppTheme.accentOrange, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text('Support Tickets',
                      style: Theme.of(context).textTheme.displaySmall),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: tickets.when(
                data: (list) => list.isEmpty
                    ? _EmptySupportState()
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                        itemCount: list.length,
                        itemBuilder: (_, i) => _TicketCard(ticket: list[i]),
                      ),
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppTheme.accentOrange)),
                error: (_, __) => _EmptySupportState(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final Map<String, dynamic> ticket;
  const _TicketCard({required this.ticket});

  static const _priorityConfig = {
    'high':   {'color': AppTheme.error,        'label': '🔴 High'},
    'medium': {'color': AppTheme.warning,      'label': '🟡 Medium'},
    'low':    {'color': AppTheme.accentGreen,  'label': '🟢 Low'},
  };

  static const _statusConfig = {
    'open':        {'color': AppTheme.error,   'label': 'Open'},
    'in_progress': {'color': AppTheme.warning, 'label': 'In Progress'},
    'resolved':    {'color': AppTheme.success, 'label': 'Resolved'},
    'closed':      {'color': AppTheme.textMuted, 'label': 'Closed'},
  };

  @override
  Widget build(BuildContext context) {
    final priority = ticket['priority'] as String? ?? 'medium';
    final status   = ticket['status'] as String? ?? 'open';
    final priCfg   = _priorityConfig[priority] ?? _priorityConfig['medium']!;
    final statCfg  = _statusConfig[status] ?? _statusConfig['open']!;
    final createdAt = ticket['createdAt'] != null
        ? DateTime.tryParse(ticket['createdAt'])
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: status == 'open'
              ? AppTheme.error.withOpacity(0.3)
              : AppTheme.border,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Text(
                  ticket['title'] ?? '',
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (statCfg['color'] as Color).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statCfg['label'] as String,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statCfg['color'] as Color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            ticket['description'] ?? '',
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          const Divider(color: AppTheme.border, height: 1),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.folder_outlined,
                  color: AppTheme.textMuted, size: 14),
              const SizedBox(width: 4),
              Text(
                ticket['projectName'] ?? '',
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                priCfg['label'] as String,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: priCfg['color'] as Color,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Text(
                createdAt != null ? timeago.format(createdAt) : '',
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.reply_rounded, size: 16),
              label: const Text('Respond to Ticket'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.accentOrange,
                side: const BorderSide(color: AppTheme.accentOrange, width: 1),
                textStyle: const TextStyle(fontFamily: 'Outfit', fontSize: 13),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptySupportState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.support_agent_outlined,
              color: AppTheme.accentOrange, size: 48),
          SizedBox(height: 12),
          Text('No support tickets',
              style: TextStyle(
                  fontFamily: 'Outfit',
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600)),
          SizedBox(height: 6),
          Text('Support tickets will appear here',
              style: TextStyle(
                  fontFamily: 'Outfit',
                  color: AppTheme.textMuted,
                  fontSize: 13)),
        ],
      ),
    );
  }
}
