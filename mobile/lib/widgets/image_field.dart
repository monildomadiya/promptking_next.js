import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import 'common.dart';
import 'form_kit.dart';

/// Picks an image, uploads it, and hands back the hosted URL.
///
/// Three ways in, because all three come up on a phone: the camera roll (a
/// wallpaper someone just made), the camera itself, and a pasted link (a
/// Midjourney or Cloudinary URL that is already online). The link route goes
/// through `/api/admin/upload_image_url`, which re-hosts it server-side — far
/// cheaper than pulling six megabytes down to the phone only to push it back.
class ImageField extends StatefulWidget {
  const ImageField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.helper,
    this.height = 150,
    this.uploadPath = '/api/admin/upload_image',
    this.uploadField = 'image',
    this.responseKey = 'imageUrl',
  });

  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String? helper;
  final double height;
  final String uploadPath;
  final String uploadField;
  final String responseKey;

  @override
  State<ImageField> createState() => _ImageFieldState();
}

class _ImageFieldState extends State<ImageField> {
  bool _busy = false;

  bool get _hasImage => widget.value != null && widget.value!.trim().isNotEmpty;

  Future<void> _pick(ImageSource source) async {
    try {
      final XFile? file = await ImagePicker().pickImage(
        source: source,
        // The upload route runs everything through Cloudinary anyway, and a
        // 48MP phone photo is a slow upload on mobile data for no gain.
        maxWidth: 4000,
        imageQuality: 92,
      );
      if (file == null) return;
      await _upload(File(file.path));
    } catch (e) {
      if (mounted) showToast(context, 'Could not open the picker: $e', error: true);
    }
  }

  Future<void> _upload(File file) async {
    setState(() => _busy = true);
    try {
      final ApiClient client = AppScope.clientOf(context);
      final String url = await client.uploadImage(
        file,
        path: widget.uploadPath,
        field: widget.uploadField,
        responseKey: widget.responseKey,
      );
      widget.onChanged(url);
      if (mounted) showToast(context, 'Image uploaded');
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } catch (e) {
      if (mounted) showToast(context, 'Upload failed: $e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _importFromUrl() async {
    final TextEditingController controller = TextEditingController(text: widget.value ?? '');
    final String? entered = await showDialog<String>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Image from a link'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.url,
          textCapitalization: TextCapitalization.none,
          decoration: const InputDecoration(hintText: 'https://…'),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textDim)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Import'),
          ),
        ],
      ),
    );

    if (entered == null || entered.isEmpty) return;
    if (!mounted) return;

    setState(() => _busy = true);
    try {
      final String url = await AppScope.clientOf(context).importImageUrl(entered);
      widget.onChanged(url);
      if (mounted) showToast(context, 'Image imported');
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openSourceSheet() {
    showModalBottomSheet<void>(
      context: context,
      builder: (BuildContext ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.of(ctx).pop();
                _pick(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take a photo'),
              onTap: () {
                Navigator.of(ctx).pop();
                _pick(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.link_rounded),
              title: const Text('Import from a link'),
              subtitle: const Text(
                'The server fetches it — nothing downloads to this phone',
                style: TextStyle(fontSize: 11.5, color: AppTheme.textDim),
              ),
              onTap: () {
                Navigator.of(ctx).pop();
                _importFromUrl();
              },
            ),
            if (_hasImage)
              ListTile(
                leading: const Icon(Icons.delete_outline_rounded, color: AppTheme.danger),
                title: const Text('Remove image', style: TextStyle(color: AppTheme.danger)),
                onTap: () {
                  Navigator.of(ctx).pop();
                  widget.onChanged(null);
                },
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(widget.label),
        const SizedBox(height: 6),
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: _busy ? null : _openSourceSheet,
          child: Container(
            height: widget.height,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppTheme.surfaceHigh,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: <Widget>[
                if (_hasImage)
                  Image.network(
                    widget.value!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _ImagePlaceholder(
                      message: 'That URL did not load',
                      icon: Icons.broken_image_outlined,
                    ),
                  )
                else
                  const _ImagePlaceholder(
                    message: 'Tap to add an image',
                    icon: Icons.add_photo_alternate_outlined,
                  ),
                if (_busy)
                  Container(
                    color: Colors.black54,
                    child: const Center(
                      child: SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    ),
                  ),
                if (_hasImage && !_busy)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.edit_rounded, size: 16, color: Colors.white),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (_hasImage)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              widget.value!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppTheme.textDim, fontSize: 11),
            ),
          ),
        if (widget.helper != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              widget.helper!,
              style: const TextStyle(color: AppTheme.textDim, fontSize: 11.5, height: 1.35),
            ),
          ),
      ],
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({required this.message, required this.icon});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        Icon(icon, size: 30, color: AppTheme.textDim),
        const SizedBox(height: 8),
        Text(message, style: const TextStyle(color: AppTheme.textDim, fontSize: 12.5)),
      ],
    );
  }
}
