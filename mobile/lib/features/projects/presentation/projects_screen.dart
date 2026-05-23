import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

final _demoProjects = [
  {
    '_id': 'p1',
    'clientName': 'Mohammed Al-Rashid',
    'email': 'm.rashid@example.com',
    'phone': '+966501234567',
    'service': 'mobile_app',
    'description': 'E-commerce app for fashion store with payment integration and delivery tracking',
    'budget': '15000',
    'status': 'new',
    'createdAt': DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
  },
  {
    '_id': 'p2',
    'clientName': 'Fatima Zahra',
    'email': 'fatima@clinic.com',
    'phone': '+20101234567',
    'service': 'web_development',
    'description': 'Medical clinic website with online booking system and patient portal',
    'budget': '8000',
    'status': 'in_review',
    'createdAt': DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
  },
  {
    '_id': 'p3',
    'clientName': 'Karim Abdallah',
    'email': 'karim@logistic.com',
    'phone': '+201098765432',
    'service': 'custom_software',
    'description': 'Fleet management system with real-time GPS tracking and reporting dashboard',
    'budget': '35000',
    'status': 'proposal_sent',
    'createdAt': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
  },
];

final projectsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final api = ref.read(apiClientProvider);
    final response = await api.get(ApiEndpoints.projects);
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return _demoProjects;
  }
});

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(projectsProvider);

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
                      color: AppTheme.accentGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.work_rounded,
                        color: AppTheme.accentGreen, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text('Project Requests',
                      style: Theme.of(context).textTheme.displaySmall),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: projects.when(
                data: (list) => list.isEmpty
                    ? _EmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                        itemCount: list.length,
                        itemBuilder: (_, i) => _ProjectCard(project: list[i]),
                      ),
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppTheme.accentGreen)),
                error: (_, __) => _EmptyState(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Map<String, dynamic> project;
  const _ProjectCard({required this.project});

  static const _statusConfig = {
    'new':           {'label': 'New',           'color': AppTheme.accent,       'icon': Icons.fiber_new_rounded},
    'in_review':     {'label': 'In Review',     'color': AppTheme.warning,      'icon': Icons.hourglass_top_rounded},
    'proposal_sent': {'label': 'Proposal Sent', 'color': AppTheme.primary,      'icon': Icons.send_rounded},
    'approved':      {'label': 'Approved',      'color': AppTheme.success,      'icon': Icons.check_circle_rounded},
    'rejected':      {'label': 'Rejected',      'color': AppTheme.error,        'icon': Icons.cancel_rounded},
  };

  static const _serviceIcons = {
    'mobile_app':     Icons.phone_android_rounded,
    'web_development': Icons.web_rounded,
    'custom_software': Icons.code_rounded,
    'cloud':          Icons.cloud_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final status = project['status'] as String? ?? 'new';
    final cfg = _statusConfig[status] ?? _statusConfig['new']!;
    final service = project['service'] as String? ?? 'web_development';
    final serviceIcon = _serviceIcons[service] ?? Icons.work_rounded;
    final createdAt = project['createdAt'] != null
        ? DateTime.tryParse(project['createdAt'])
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: AppTheme.cardGradient,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Icon(serviceIcon, color: AppTheme.primary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      project['clientName'] ?? 'Unknown',
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      project['email'] ?? '',
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              // Status
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (cfg['color'] as Color).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                      color: (cfg['color'] as Color).withOpacity(0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(cfg['icon'] as IconData,
                        color: cfg['color'] as Color, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      cfg['label'] as String,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: cfg['color'] as Color,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          // Description
          Text(
            project['description'] ?? '',
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          const Divider(color: AppTheme.border, height: 1),
          const SizedBox(height: 12),

          // Footer
          Row(
            children: [
              Icon(Icons.attach_money_rounded,
                  color: AppTheme.accentGreen, size: 16),
              const SizedBox(width: 4),
              Text(
                '\$${project['budget'] ?? '?'}',
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.accentGreen,
                ),
              ),
              const SizedBox(width: 12),
              Icon(Icons.phone_outlined, color: AppTheme.textMuted, size: 14),
              const SizedBox(width: 4),
              Text(
                project['phone'] ?? '',
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 12,
                  color: AppTheme.textMuted,
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
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.work_outline_rounded,
              color: AppTheme.accentGreen, size: 48),
          SizedBox(height: 12),
          Text('No project requests',
              style: TextStyle(
                  fontFamily: 'Outfit',
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600)),
          SizedBox(height: 6),
          Text('New project requests will appear here',
              style: TextStyle(
                  fontFamily: 'Outfit',
                  color: AppTheme.textMuted,
                  fontSize: 13)),
        ],
      ),
    );
  }
}
