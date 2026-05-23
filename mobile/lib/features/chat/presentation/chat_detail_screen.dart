import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../core/socket/socket_service.dart';
import '../data/chat_provider.dart';

class ChatDetailScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const ChatDetailScreen({super.key, required this.sessionId});

  @override
  ConsumerState<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends ConsumerState<ChatDetailScreen> {
  final _msgCtrl        = TextEditingController();
  final _scrollCtrl     = ScrollController();
  bool _isTyping        = false;
  bool _visitorTyping   = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _listenSocket();
  }

  Future<void> _loadMessages() async {
    final msgs = await ref.read(chatMessagesProvider(widget.sessionId).future);
    ref.read(chatDetailProvider(widget.sessionId).notifier).setMessages(msgs);
    _scrollToBottom();
  }

  void _listenSocket() {
    final socket = ref.read(socketServiceProvider);
    socket.joinSession(widget.sessionId);

    socket.onNewMessage((data) {
      if (data['sessionId'] == widget.sessionId) {
        ref
            .read(chatDetailProvider(widget.sessionId).notifier)
            .addMessage(data);
        _scrollToBottom();
      }
    });

    socket.onVisitorTyping((data) {
      if (data['sessionId'] == widget.sessionId) {
        setState(() => _visitorTyping = data['isTyping'] ?? false);
      }
    });
  }

  @override
  void dispose() {
    final socket = ref.read(socketServiceProvider);
    socket.leaveSession(widget.sessionId);
    socket.off('visitor:message');
    socket.off('visitor:typing');
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;

    final socket = ref.read(socketServiceProvider);
    socket.sendAdminMessage(sessionId: widget.sessionId, message: text);

    // Optimistic update
    ref.read(chatDetailProvider(widget.sessionId).notifier).addMessage({
      '_id': 'temp-${DateTime.now().millisecondsSinceEpoch}',
      'sender': 'admin',
      'content': text,
      'createdAt': DateTime.now().toIso8601String(),
    });

    _msgCtrl.clear();
    setState(() => _isTyping = false);
    _scrollToBottom();
  }

  void _onTextChanged(String val) {
    final typing = val.isNotEmpty;
    if (typing != _isTyping) {
      setState(() => _isTyping = typing);
      ref.read(socketServiceProvider).sendTyping(widget.sessionId, typing);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatDetailProvider(widget.sessionId));

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: _buildAppBar(context),
      body: Column(
        children: [
          // ─── Messages ──────────────────────────────────────────────────────
          Expanded(
            child: messages.isEmpty
                ? const _EmptyChatState()
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount: messages.length + (_visitorTyping ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (_visitorTyping && i == messages.length) {
                        return _TypingIndicator();
                      }
                      return _MessageBubble(message: messages[i]);
                    },
                  ),
          ),

          // ─── Input ─────────────────────────────────────────────────────────
          _InputBar(
            controller: _msgCtrl,
            onChanged: _onTextChanged,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppTheme.bgCard,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
        onPressed: () => Navigator.pop(context),
        color: AppTheme.textPrimary,
      ),
      title: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: Text(
                'V',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Visitor Chat',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppTheme.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'Online',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 11,
                      color: AppTheme.success,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.close_rounded, color: AppTheme.error),
          onPressed: () => _showCloseDialog(context),
          tooltip: 'Close session',
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: AppTheme.border),
      ),
    );
  }

  void _showCloseDialog(BuildContext ctx) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Close Session',
            style: TextStyle(fontFamily: 'Outfit', color: AppTheme.textPrimary)),
        content: const Text(
          'This will end the chat session with the visitor.',
          style: TextStyle(fontFamily: 'Outfit', color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel',
                style: TextStyle(color: AppTheme.textMuted, fontFamily: 'Outfit')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close Chat',
                style: TextStyle(color: AppTheme.error, fontFamily: 'Outfit')),
          ),
        ],
      ),
    );
  }
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isAdmin = message['sender'] == 'admin';
    final time = message['createdAt'] != null
        ? DateTime.tryParse(message['createdAt'])
        : null;

    return Align(
      alignment: isAdmin ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        child: Column(
          crossAxisAlignment:
              isAdmin ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Bubble
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: isAdmin ? AppTheme.primaryGradient : null,
                color: isAdmin ? null : AppTheme.bgCard,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isAdmin ? 16 : 4),
                  bottomRight: Radius.circular(isAdmin ? 4 : 16),
                ),
                border: isAdmin
                    ? null
                    : Border.all(color: AppTheme.border),
                boxShadow: isAdmin ? AppTheme.primaryGlow : AppTheme.cardShadow,
              ),
              child: Text(
                message['content'] ?? '',
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 14,
                  color: isAdmin ? Colors.white : AppTheme.textPrimary,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              time != null ? timeago.format(time) : '',
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 10,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            3,
            (i) => AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(
                    0.4 + 0.6 * (_ctrl.value - (i * 0.15)).clamp(0.0, 1.0),
                  ),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Input Bar ────────────────────────────────────────────────────────────────
class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;
  const _InputBar({
    required this.controller,
    required this.onChanged,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 10, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        border: const Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              onSubmitted: (_) => onSend(),
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontFamily: 'Outfit',
                fontSize: 14,
              ),
              maxLines: 4,
              minLines: 1,
              decoration: InputDecoration(
                hintText: 'Type your reply...',
                hintStyle: const TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Outfit',
                  fontSize: 14,
                ),
                filled: true,
                fillColor: AppTheme.bgCardLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide:
                      const BorderSide(color: AppTheme.primary, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: onSend,
            child: Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: AppTheme.primaryGlow,
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyChatState extends StatelessWidget {
  const _EmptyChatState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline_rounded,
              color: AppTheme.textMuted, size: 48),
          SizedBox(height: 12),
          Text(
            'No messages yet',
            style: TextStyle(
              fontFamily: 'Outfit',
              color: AppTheme.textSecondary,
              fontSize: 16,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Start the conversation!',
            style: TextStyle(
              fontFamily: 'Outfit',
              color: AppTheme.textMuted,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
