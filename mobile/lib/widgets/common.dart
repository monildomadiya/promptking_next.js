import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Shared pieces every screen needs: the three states a remote list can be in,
/// a confirm dialog, and the toast helpers. Kept in one file because each is a
/// dozen lines and splitting them costs more in imports than it saves.

void showToast(BuildContext context, String message, {bool error = false}) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? AppTheme.danger : AppTheme.surfaceHigh,
        duration: Duration(seconds: error ? 5 : 3),
      ),
    );
}

/// Destructive actions on a phone deserve a second tap — a delete here is a
/// row gone from production, and the panel has no undo.
Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Delete',
  bool destructive = true,
}) async {
  final bool? answer = await showDialog<bool>(
    context: context,
    builder: (BuildContext ctx) => AlertDialog(
      title: Text(title),
      content: Text(message, style: const TextStyle(color: AppTheme.textDim, height: 1.4)),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancel', style: TextStyle(color: AppTheme.textDim)),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: destructive ? AppTheme.danger : AppTheme.gold,
            foregroundColor: destructive ? Colors.white : const Color(0xFF1A1206),
          ),
          onPressed: () => Navigator.of(ctx).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return answer ?? false;
}

class LoadingState extends StatelessWidget {
  const LoadingState({super.key, this.label});

  final String? label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox(
            width: 30,
            height: 30,
            child: CircularProgressIndicator(strokeWidth: 2.5),
          ),
          if (label != null) ...<Widget>[
            const SizedBox(height: 16),
            Text(label!, style: const TextStyle(color: AppTheme.textDim)),
          ],
        ],
      ),
    );
  }
}

/// A failed load is nearly always the server address, the PIN expiring, or the
/// phone being on a train, so the message gets room and a retry sits under it.
class ErrorStateView extends StatelessWidget {
  const ErrorStateView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.cloud_off_rounded, size: 44, color: AppTheme.textDim),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textDim, height: 1.5),
            ),
            if (onRetry != null) ...<Widget>[
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon = Icons.inbox_rounded,
    this.action,
  });

  final String title;
  final String? message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: 44, color: AppTheme.textDim.withValues(alpha: 0.6)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            if (message != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textDim, height: 1.5),
              ),
            ],
            if (action != null) ...<Widget>[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}

/// A small pill for a row's flags — DRAFT, PREMIUM, FEATURED and the like.
class StatusPill extends StatelessWidget {
  const StatusPill(this.label, {super.key, this.color = AppTheme.textDim, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (icon != null) ...<Widget>[
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// Thumbnails come from Cloudinary and R2, both of which can 404 after a
/// wallpaper is replaced. A broken image in a list should be a grey box, not a
/// red exception widget sitting in the middle of the row.
class RemoteThumb extends StatelessWidget {
  const RemoteThumb({
    super.key,
    required this.url,
    this.size = 52,
    this.radius = 10,
    this.fallbackIcon = Icons.image_outlined,
  });

  final String? url;
  final double size;
  final double radius;
  final IconData fallbackIcon;

  @override
  Widget build(BuildContext context) {
    final Widget placeholder = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.surfaceHigh,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Icon(fallbackIcon, size: size * 0.42, color: AppTheme.textDim),
    );

    if (url == null || url!.trim().isEmpty || !url!.startsWith('http')) {
      return placeholder;
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.network(
        url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        // Decoding a 4000px wallpaper at 52dp is how a list starts dropping
        // frames on a mid-range phone.
        cacheWidth: (size * 3).round(),
        errorBuilder: (_, __, ___) => placeholder,
        loadingBuilder: (BuildContext context, Widget child, ImageChunkEvent? progress) {
          if (progress == null) return child;
          return Container(
            width: size,
            height: size,
            color: AppTheme.surfaceHigh,
          );
        },
      ),
    );
  }
}

/// The search box above every list.
class SearchBarField extends StatelessWidget {
  const SearchBarField({
    super.key,
    required this.onChanged,
    this.hint = 'Search',
    this.controller,
  });

  final ValueChanged<String> onChanged;
  final String hint;
  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.textDim),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      ),
    );
  }
}
