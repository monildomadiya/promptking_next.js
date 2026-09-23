import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import 'wallpaper_editor.dart';

/// Wallpapers, as a grid.
///
/// The other sections are lists because their rows are text; a wallpaper is
/// the image, and a 52dp thumbnail beside a title tells you nothing about
/// whether the crop is right. The category filter comes from
/// `wallpaper_categories`, which the admin listing keeps even when empty.
class WallpapersScreen extends StatefulWidget {
  const WallpapersScreen({super.key});

  @override
  State<WallpapersScreen> createState() => _WallpapersScreenState();
}

class _WallpapersScreenState extends State<WallpapersScreen> {
  late final AdminApi _api;

  List<Map<String, dynamic>> _rows = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _categories = <Map<String, dynamic>>[];

  String _query = '';
  String? _categoryFilter;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final List<Map<String, dynamic>> rows = await _api.list('wallpapers');
      final List<Map<String, dynamic>> categories = await _api.list('wallpaper_categories');
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _categories = categories;
        _error = null;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _visible {
    final String needle = _query.toLowerCase().trim();
    return _rows.where((Map<String, dynamic> row) {
      if (_categoryFilter != null && V.asString(row['category_id']) != _categoryFilter) {
        return false;
      }
      if (needle.isEmpty) return true;
      return V.asString(row['title']).toLowerCase().contains(needle) ||
          V.asString(row['tags']).toLowerCase().contains(needle);
    }).toList();
  }

  Future<void> _edit(Map<String, dynamic>? row) async {
    final bool? saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(builder: (_) => WallpaperEditor(wallpaper: row)),
    );
    if (saved == true) _load(silent: true);
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    final bool ok = await confirmDialog(
      context,
      title: 'Delete this wallpaper?',
      message: '"${V.asString(row['title'])}" will be removed from the live site. '
          'The image itself stays in storage.',
    );
    if (!ok) return;

    final String id = V.asString(row['id']);
    if (id.isEmpty) {
      if (mounted) showToast(context, 'That row has no id to delete by.', error: true);
      return;
    }

    try {
      await _api.deleteItem('wallpaper', id);
      if (!mounted) return;
      showToast(context, 'Deleted');
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    }
  }

  void _openMenu(Map<String, dynamic> row) {
    showModalBottomSheet<void>(
      context: context,
      builder: (BuildContext ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text(
                V.asString(row['title']),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.edit_outlined),
              title: const Text('Edit'),
              onTap: () {
                Navigator.of(ctx).pop();
                _edit(row);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: AppTheme.danger),
              title: const Text('Delete', style: TextStyle(color: AppTheme.danger)),
              onTap: () {
                Navigator.of(ctx).pop();
                _delete(row);
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
    return Scaffold(
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: SearchBarField(
              hint: 'Search wallpapers',
              onChanged: (String value) => setState(() => _query = value),
            ),
          ),
          if (_categories.isNotEmpty)
            SizedBox(
              height: 34,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: <Widget>[
                  _categoryChip('All', null),
                  for (final Map<String, dynamic> category in _categories)
                    _categoryChip(
                      V.asString(category['name']),
                      V.asString(category['id']),
                      count: V.asInt(category['wallpaper_count']),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 10),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(null),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New wallpaper'),
      ),
    );
  }

  Widget _categoryChip(String label, String? id, {int? count}) {
    final bool selected = _categoryFilter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _categoryFilter = id),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppTheme.gold.withValues(alpha: 0.16) : AppTheme.surface,
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: selected ? AppTheme.gold : AppTheme.border),
          ),
          child: Text(
            count == null ? label : '$label  $count',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: selected ? AppTheme.gold : AppTheme.textDim,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const LoadingState();
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);

    final List<Map<String, dynamic>> rows = _visible;

    if (_rows.isEmpty) {
      return const EmptyState(
        icon: Icons.wallpaper_rounded,
        title: 'No wallpapers yet',
        message: 'Add the first one with the button below.',
      );
    }
    if (rows.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No matches',
        message: 'Nothing matches that search and category.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      color: AppTheme.gold,
      backgroundColor: AppTheme.surface,
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
        physics: const AlwaysScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.66,
        ),
        itemCount: rows.length,
        itemBuilder: (BuildContext context, int index) {
          final Map<String, dynamic> row = rows[index];
          return _WallpaperCard(
            row: row,
            onTap: () => _edit(row),
            onLongPress: () => _openMenu(row),
          );
        },
      ),
    );
  }
}

class _WallpaperCard extends StatelessWidget {
  const _WallpaperCard({
    required this.row,
    required this.onTap,
    required this.onLongPress,
  });

  final Map<String, dynamic> row;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final bool draft = V.asBool(row['is_draft']);
    final bool featured = V.asBool(row['is_featured']);
    final String url = V.asString(row['image_url']);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: <Widget>[
                  if (url.startsWith('http'))
                    Image.network(
                      url,
                      fit: BoxFit.cover,
                      cacheWidth: 480,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppTheme.surfaceHigh,
                        child: const Icon(Icons.broken_image_outlined,
                            color: AppTheme.textDim),
                      ),
                    )
                  else
                    Container(
                      color: AppTheme.surfaceHigh,
                      child: const Icon(Icons.wallpaper_rounded, color: AppTheme.textDim),
                    ),
                  if (draft || featured)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: Wrap(
                        spacing: 5,
                        children: <Widget>[
                          if (draft)
                            const StatusPill('DRAFT', color: Color(0xFFCBD5E1)),
                          if (featured)
                            const StatusPill('★', color: AppTheme.gold),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 9, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    V.asString(row['title'], fallback: 'Untitled'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    V.asString(row['orientation'], fallback: 'both'),
                    style: const TextStyle(fontSize: 11, color: AppTheme.textDim),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
