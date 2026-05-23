import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ActivityFeed extends StatelessWidget {
  const ActivityFeed({super.key});

  static final _activities = [
    _Activity(
      icon: Icons.chat_bubble_rounded,
      color: AppTheme.primary,
      title: 'New visitor started a chat',
      subtitle: 'Visitor asked about mobile app development',
      time: '2 min ago',
    ),
    _Activity(
      icon: Icons.auto_awesome_rounded,
      color: AppTheme.accent,
      title: 'AI Demo generated',
      subtitle: 'Restaurant website demo for "Al Nakheel"',
      time: '15 min ago',
    ),
    _Activity(
      icon: Icons.work_rounded,
      color: AppTheme.accentGreen,
      title: 'New project request',
      subtitle: 'E-commerce platform — Ahmed Hassan',
      time: '1 hr ago',
    ),
    _Activity(
      icon: Icons.support_agent_rounded,
      color: AppTheme.accentOrange,
      title: 'Support ticket opened',
      subtitle: 'Bug report on FoodFlow project',
      time: '3 hr ago',
    ),
    _Activity(
      icon: Icons.check_circle_rounded,
      color: AppTheme.success,
      title: 'Project delivered',
      subtitle: 'MedSync v2.0 delivered to client',
      time: 'Yesterday',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _activities
          .map((a) => _ActivityTile(activity: a))
          .toList(),
    );
  }
}

class _Activity {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String time;
  const _Activity({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.time,
  });
}

class _ActivityTile extends StatelessWidget {
  final _Activity activity;
  const _ActivityTile({required this.activity});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: activity.color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(activity.icon, color: activity.color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  activity.subtitle,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: AppTheme.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            activity.time,
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
