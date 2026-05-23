import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class VixcellButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool fullWidth;
  final LinearGradient? gradient;
  final IconData? icon;
  final Color? backgroundColor;
  final bool outlined;

  const VixcellButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.fullWidth = false,
    this.gradient,
    this.icon,
    this.backgroundColor,
    this.outlined = false,
  });

  @override
  State<VixcellButton> createState() => _VixcellButtonState();
}

class _VixcellButtonState extends State<VixcellButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleCtrl;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _scaleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.96,
      upperBound: 1.0,
      value: 1.0,
    );
    _scaleAnim = _scaleCtrl;
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _scaleCtrl.reverse(),
      onTapUp: (_) {
        _scaleCtrl.forward();
        widget.onPressed?.call();
      },
      onTapCancel: () => _scaleCtrl.forward(),
      child: ScaleTransition(
        scale: _scaleAnim,
        child: SizedBox(
          width: widget.fullWidth ? double.infinity : null,
          height: 52,
          child: widget.outlined
              ? _OutlinedContent(widget)
              : _FilledContent(widget),
        ),
      ),
    );
  }
}

class _FilledContent extends StatelessWidget {
  final VixcellButton w;
  const _FilledContent(this.w);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: w.gradient,
        color: w.gradient == null ? (w.backgroundColor ?? AppTheme.primary) : null,
        borderRadius: BorderRadius.circular(14),
        boxShadow: w.gradient != null ? AppTheme.primaryGlow : null,
      ),
      child: Center(
        child: w.isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    w.label,
                    style: const TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                  if (w.icon != null) ...[
                    const SizedBox(width: 8),
                    Icon(w.icon, color: Colors.white, size: 18),
                  ],
                ],
              ),
      ),
    );
  }
}

class _OutlinedContent extends StatelessWidget {
  final VixcellButton w;
  const _OutlinedContent(this.w);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.primary, width: 1.5),
      ),
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              w.label,
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.primary,
              ),
            ),
            if (w.icon != null) ...[
              const SizedBox(width: 8),
              Icon(w.icon, color: AppTheme.primary, size: 18),
            ],
          ],
        ),
      ),
    );
  }
}
