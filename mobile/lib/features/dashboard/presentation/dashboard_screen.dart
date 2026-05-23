import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/socket/socket_service.dart';
import '../../chat/presentation/chat_list_screen.dart';
import '../../ai_demos/presentation/ai_demos_screen.dart';
import '../../projects/presentation/projects_screen.dart';
import '../../support/presentation/support_screen.dart';
import 'widgets/stat_card.dart';
import 'widgets/activity_feed.dart';
import 'dashboard_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    _DashboardHome(),
    ChatListScreen(),
    AiDemosScreen(),
    ProjectsScreen(),
    SupportScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  void _initSocket() {
    final auth  = ref.read(authStateProvider);
    final socket = ref.read(socketServiceProvider);
    if (auth.token != null) socket.connect(auth.token!);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _pages),
      bottomNavigationBar: _BottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}

// ─── Dashboard Home ──────────────────────────────────────────────────────────
class _DashboardHome extends ConsumerWidget {
  const _DashboardHome();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth  = ref.watch(authStateProvider);
    final stats = ref.watch(dashboardStatsProvider);

    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.bgGradient),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ─── Header ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _greeting(),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textMuted,
                              ),
                        ),
                        const SizedBox(height: 2),
                        ShaderMask(
                          shaderCallback: (b) =>
                              AppTheme.primaryGradient.createShader(b),
                          child: Text(
                            auth.adminName ?? 'Admin',
                            style: Theme.of(context)
                                .textTheme
                                .displaySmall
                                ?.copyWith(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    // Notifications icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Avatar / logout
                    GestureDetector(
                      onTap: () => _showLogoutDialog(context, ref),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: AppTheme.primaryGlow,
                        ),
                        child: const Icon(Icons.person_rounded,
                            color: Colors.white, size: 22),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ─── Status indicator ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: _StatusBanner(),
              ),
            ),

            // ─── Stats Grid ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: stats.when(
                  data: (data) => _StatsGrid(stats: data),
                  loading: () => _StatsGridShimmer(),
                  error: (_, __) => _StatsGridError(
                    onRetry: () => ref.refresh(dashboardStatsProvider),
                  ),
                ),
              ),
            ),

            // ─── Quick Actions ──────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quick Actions',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QuickAction(
                          label: 'Chat',
                          icon: Icons.chat_bubble_outline_rounded,
                          color: AppTheme.primary,
                          onTap: () {},
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          label: 'AI Demos',
                          icon: Icons.auto_awesome_rounded,
                          color: AppTheme.accent,
                          onTap: () {},
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          label: 'Projects',
                          icon: Icons.work_outline_rounded,
                          color: AppTheme.accentGreen,
                          onTap: () {},
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          label: 'Support',
                          icon: Icons.support_agent_rounded,
                          color: AppTheme.accentOrange,
                          onTap: () {},
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ─── Recent Activity ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Recent Activity',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    const ActivityFeed(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning 🌤';
    if (h < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  }

  void _showLogoutDialog(BuildContext ctx, WidgetRef ref) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign Out',
            style: TextStyle(fontFamily: 'Outfit', color: AppTheme.textPrimary)),
        content: const Text('Are you sure you want to sign out?',
            style: TextStyle(fontFamily: 'Outfit', color: AppTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel',
                style: TextStyle(color: AppTheme.textMuted, fontFamily: 'Outfit')),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authStateProvider.notifier).logout();
            },
            child: const Text('Sign Out',
                style: TextStyle(color: AppTheme.error, fontFamily: 'Outfit')),
          ),
        ],
      ),
    );
  }
}

// ─── Stats Grid ──────────────────────────────────────────────────────────────
class _StatsGrid extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: StatCard(
                title: 'Active Chats',
                value: '${stats['activeChats'] ?? 0}',
                icon: Icons.chat_bubble_rounded,
                gradient: AppTheme.primaryGradient,
                trend: '+3 today',
                trendUp: true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatCard(
                title: 'AI Demos',
                value: '${stats['totalDemos'] ?? 0}',
                icon: Icons.auto_awesome_rounded,
                gradient: const LinearGradient(
                  colors: [AppTheme.accent, Color(0xFF0099CC)],
                ),
                trend: '+12 this week',
                trendUp: true,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: StatCard(
                title: 'New Projects',
                value: '${stats['newProjects'] ?? 0}',
                icon: Icons.work_rounded,
                gradient: AppTheme.successGradient,
                trend: '2 pending',
                trendUp: false,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatCard(
                title: 'Support Tickets',
                value: '${stats['openTickets'] ?? 0}',
                icon: Icons.support_agent_rounded,
                gradient: AppTheme.warningGradient,
                trend: '5 open',
                trendUp: false,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatsGridShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _ShimmerBox(height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _ShimmerBox(height: 110)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _ShimmerBox(height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _ShimmerBox(height: 110)),
          ],
        ),
      ],
    );
  }
}

class _StatsGridError extends StatelessWidget {
  final VoidCallback onRetry;
  const _StatsGridError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.error.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.wifi_off_rounded, color: AppTheme.error, size: 32),
          const SizedBox(height: 8),
          const Text('Could not load stats',
              style: TextStyle(color: AppTheme.textSecondary, fontFamily: 'Outfit')),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onRetry,
            child: const Text('Retry',
                style: TextStyle(color: AppTheme.primary, fontFamily: 'Outfit')),
          ),
        ],
      ),
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double height;
  const _ShimmerBox({required this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
    );
  }
}

// ─── Status Banner ───────────────────────────────────────────────────────────
class _StatusBanner extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final socket = ref.watch(socketServiceProvider);
    final isConnected = socket.isConnected;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isConnected
            ? AppTheme.success.withOpacity(0.1)
            : AppTheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isConnected
              ? AppTheme.success.withOpacity(0.3)
              : AppTheme.error.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isConnected ? AppTheme.success : AppTheme.error,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isConnected ? 'Real-time connected' : 'Disconnected — Reconnecting...',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 12,
              color: isConnected ? AppTheme.success : AppTheme.error,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Quick Action ────────────────────────────────────────────────────────────
class _QuickAction extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────────
class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        border: const Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: SafeArea(
        top: false,
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: onTap,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textMuted,
          selectedLabelStyle: const TextStyle(
              fontFamily: 'Outfit', fontSize: 11, fontWeight: FontWeight.w600),
          unselectedLabelStyle:
              const TextStyle(fontFamily: 'Outfit', fontSize: 11),
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              activeIcon: Icon(Icons.chat_bubble_rounded),
              label: 'Chat',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome_rounded),
              label: 'AI Demos',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.work_outline_rounded),
              activeIcon: Icon(Icons.work_rounded),
              label: 'Projects',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.support_agent_outlined),
              activeIcon: Icon(Icons.support_agent_rounded),
              label: 'Support',
            ),
          ],
        ),
      ),
    );
  }
}
