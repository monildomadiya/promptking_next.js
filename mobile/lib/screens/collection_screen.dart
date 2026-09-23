import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';

/// Describes one admin collection to [CollectionScreen].
///
/// Nine of the panel's sections are the same screen with different columns —
/// load a list, search it, tap a row to edit, swipe or long-press to delete.
/// Writing nine of those by hand is how three of them end up with a slightly
/// different delete confirmation and one of them forgets to refresh after a
/// save. Prompts and wallpapers are the exceptions and have their own screens.
class CollectionSpec {
  const CollectionSpec({
    required this.title,
    required this.endpoint,
    required this.deleteType,
    required this.titleOf,
    required this.openEditor,
    this.idField = 'id',
    this.icon = Icons.list_alt_rounded,
    this.subtitleOf,
    this.thumbOf,
    this.pillsOf,
    this.searchFields = const <String>['title', 'name'],
    this.emptyMessage,
    this.createLabel,
    this.fallbackIcon = Icons.image_outlined,
    this.canCreate = true,
    this.canDelete = true,
  });

  /// Shown in the app bar.
  final String title;

  /// Route segment under `/api/admin/` — `blogs`, `authors`, `faqs`…
  final String endpoint;

  /// The `delete_<type>/<id>` segment. Not always the singular of [endpoint]:
  /// `website_categories` deletes through `delete_website_category`.
  final String deleteType;

  /// Which column identifies a row for deletion.
  final String idField;

  final IconData icon;
  final IconData fallbackIcon;

  final String Function(Map<String, dynamic> row) titleOf;
  final String? Function(Map<String, dynamic> row)? subtitleOf;
  final String? Function(Map<String, dynamic> row)? thumbOf;
  final List<Widget> Function(Map<String, dynamic> row)? pillsOf;

  /// Columns the search box matches against.
  final List<String> searchFields;

  final String? emptyMessage;
  final String? createLabel;
  final bool canCreate;
  final bool canDelete;

  /// Opens the editor for [row], or the create form when it is null. Returns
  /// true when something was saved, which is the screen's cue to reload.
  final Future<bool?> Function(BuildContext context, Map<String, dynamic>? row) openEditor;
}

class CollectionScreen extends StatefulWidget {
  const CollectionScreen({super.key, required this.spec});

  final CollectionSpec spec;

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  late final AdminApi _api;

  List<Map<String, dynamic>> _rows = <Map<String, dynamic>>[];
  String _query = '';
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
      final List<Map<String, dynamic>> rows = await _api.list(widget.spec.endpoint);
      if (!mounted) return;
      setState(() {
        _rows = rows;
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
    if (_query.trim().isEmpty) return _rows;
    final String needle = _query.toLowerCase().trim();
    return _rows.where((Map<String, dynamic> row) {
      for (final String field in widget.spec.searchFields) {
        final String value = V.asString(row[field]).toLowerCase();
        if (value.contains(needle)) return true;
      }
      return false;
    }).toList();
  }

  Future<void> _edit(Map<String, dynamic>? row) async {
    final bool? saved = await widget.spec.openEditor(context, row);
    if (saved == true) _load(silent: true);
  }

  Future<void> _delete(Map<String, dynamic> row) async {
    final String name = widget.spec.titleOf(row);
    final bool ok = await confirmDialog(
      context,
      title: 'Delete this ${widget.spec.deleteType.replaceAll('_', ' ')}?',
      message: '"$name" will be removed from the live site immediately. '
          'This cannot be undone.',
    );
    if (!ok) return;

    final Object? id = row[widget.spec.idField];
    if (id == null) {
      if (mounted) showToast(context, 'That row has no id to delete by.', error: true);
      return;
    }

    try {
      await _api.deleteItem(widget.spec.deleteType, id);
      if (!mounted) return;
      showToast(context, 'Deleted');
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    }
  }

  void _openRowMenu(Map<String, dynamic> row) {
    showModalBottomSheet<void>(
      context: context,
      builder: (BuildContext ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text(
                widget.spec.titleOf(row),
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
            if (widget.spec.canDelete)
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
    final List<Map<String, dynamic>> rows = _visible;

    return Scaffold(
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: SearchBarField(
              hint: 'Search ${widget.spec.title.toLowerCase()}',
              onChanged: (String value) => setState(() => _query = value),
            ),
          ),
          if (!_loading && _error == null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Row(
                children: <Widget>[
                  Text(
                    '${rows.length} of ${_rows.length}',
                    style: const TextStyle(color: AppTheme.textDim, fontSize: 12),
                  ),
                ],
              ),
            ),
          Expanded(child: _buildBody(rows)),
        ],
      ),
      floatingActionButton: widget.spec.canCreate
          ? FloatingActionButton.extended(
              onPressed: () => _edit(null),
              icon: const Icon(Icons.add_rounded),
              label: Text(widget.spec.createLabel ?? 'New'),
            )
          : null,
    );
  }

  Widget _buildBody(List<Map<String, dynamic>> rows) {
    if (_loading) return const LoadingState();
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    if (_rows.isEmpty) {
      return EmptyState(
        icon: widget.spec.icon,
        title: 'Nothing here yet',
        message: widget.spec.emptyMessage ??
            'Add the first ${widget.spec.deleteType.replaceAll('_', ' ')} with the button below.',
      );
    }
    if (rows.isEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No matches',
        message: 'Nothing in ${widget.spec.title.toLowerCase()} matches "$_query".',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _load(silent: true),
      color: AppTheme.gold,
      backgroundColor: AppTheme.surface,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: rows.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (BuildContext context, int index) {
          final Map<String, dynamic> row = rows[index];
          return _CollectionTile(
            spec: widget.spec,
            row: row,
            onTap: () => _edit(row),
            onLongPress: () => _openRowMenu(row),
          );
        },
      ),
    );
  }
}

class _CollectionTile extends StatelessWidget {
  const _CollectionTile({
    required this.spec,
    required this.row,
    required this.onTap,
    required this.onLongPress,
  });

  final CollectionSpec spec;
  final Map<String, dynamic> row;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final String? subtitle = spec.subtitleOf?.call(row);
    final List<Widget> pills = spec.pillsOf?.call(row) ?? <Widget>[];

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              if (spec.thumbOf != null) ...<Widget>[
                RemoteThumb(
                  url: spec.thumbOf!(row),
                  fallbackIcon: spec.fallbackIcon,
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      spec.titleOf(row),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                    if (subtitle != null && subtitle.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textDim,
                          height: 1.35,
                        ),
                      ),
                    ],
                    if (pills.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 8),
                      Wrap(spacing: 6, runSpacing: 6, children: pills),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                onPressed: onLongPress,
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.more_vert_rounded, size: 20, color: AppTheme.textDim),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
