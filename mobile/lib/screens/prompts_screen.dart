import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import 'prompt_editor.dart';

enum _PromptFilter { all, featured, premium, draft }

/// Prompts and listicles.
///
/// Both are rows in `prompts`; the only difference is whether
/// `website_category_id` is set, which is what splits `/api/admin/prompts`
/// from `/api/admin/listicles`. Same columns, same editor, same bulk actions —
/// so it is one screen with a flag rather than two that drift apart.
class PromptsScreen extends StatefulWidget {
  const PromptsScreen({super.key, this.listicles = false});

  final bool listicles;

  @override
  State<PromptsScreen> createState() => _PromptsScreenState();
}

class _PromptsScreenState extends State<PromptsScreen> {
  late final AdminApi _api;

  List<Map<String, dynamic>> _rows = <Map<String, dynamic>>[];
  final Set<String> _selected = <String>{};

  String _query = '';
  _PromptFilter _filter = _PromptFilter.all;
  bool _loading = true;
  bool _selecting = false;
  bool _reordering = false;
  bool _busy = false;
  String? _error;

  String get _endpoint => widget.listicles ? 'listicles' : 'prompts';
  // Both delete through delete_prompt: a listicle is a row in `prompts`, and
  // there is no delete_listicle route to call.
  String get _deleteType => 'prompt';
  String get _noun => widget.listicles ? 'listicle' : 'prompt';

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _load();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final List<Map<String, dynamic>> rows = await _api.list(_endpoint);
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
    final String needle = _query.toLowerCase().trim();
    return _rows.where((Map<String, dynamic> row) {
      if (_filter == _PromptFilter.featured && !V.asBool(row['is_featured'])) {
        return false;
      }
      if (_filter == _PromptFilter.premium && !V.asBool(row['is_premium'])) {
        return false;
      }
      if (_filter == _PromptFilter.draft && !V.asBool(row['is_draft'])) {
        return false;
      }
      if (needle.isEmpty) return true;
      return V.asString(row['title']).toLowerCase().contains(needle) ||
          V.asString(row['prompt_key']).toLowerCase().contains(needle) ||
          V.asString(row['tags']).toLowerCase().contains(needle);
    }).toList();
  }

  // --- Actions --------------------------------------------------------------

  Future<void> _edit(Map<String, dynamic>? row) async {
    final bool? saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => PromptEditor(prompt: row, listicle: widget.listicles),
      ),
    );
    if (saved == true) _load(silent: true);
  }

  Future<void> _toggle(Map<String, dynamic> row, String field) async {
    final String key = V.asString(row['prompt_key']);
    final bool next = !V.asBool(row[field]);

    // Turning premium on without a PIN would publish a locked prompt nobody
    // can open, so ask for one the way the web panel does.
    String? pin;
    if (field == 'is_premium' && next) {
      pin = await _askForPin();
      if (pin == null) return;
    }

    setState(() => _busy = true);
    try {
      if (field == 'is_featured') {
        await _api.toggleFeatured(key, next);
      } else {
        await _api.toggleStatus(key, field, next, pin: pin);
      }
      if (!mounted) return;
      setState(() => row[field] = next);
      showToast(context, next ? 'Turned on' : 'Turned off');
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<String?> _askForPin() async {
    final TextEditingController controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Unlock PIN'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: 'PIN readers must enter'),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textDim)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Set premium'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteOne(Map<String, dynamic> row) async {
    final bool ok = await confirmDialog(
      context,
      title: 'Delete this $_noun?',
      message: '"${V.asString(row['title'])}" will disappear from the live site '
          'immediately. This cannot be undone.',
    );
    if (!ok) return;

    try {
      await _api.deleteItem(_deleteType, V.asString(row['prompt_key']));
      if (!mounted) return;
      showToast(context, 'Deleted');
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    }
  }

  Future<void> _bulkDelete() async {
    final bool ok = await confirmDialog(
      context,
      title: 'Delete ${_selected.length} ${_noun}s?',
      message: 'All ${_selected.length} selected rows will be removed from the '
          'live site. This cannot be undone.',
    );
    if (!ok) return;

    setState(() => _busy = true);
    try {
      await _api.bulkDeletePrompts(_selected.toList());
      if (!mounted) return;
      showToast(context, 'Deleted ${_selected.length}');
      setState(() {
        _selected.clear();
        _selecting = false;
      });
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _bulkHide(bool hide) async {
    setState(() => _busy = true);
    try {
      await _api.bulkHidePrompts(_selected.toList(), hide);
      if (!mounted) return;
      showToast(context, hide ? 'Hidden' : 'Published');
      setState(() {
        _selected.clear();
        _selecting = false;
      });
      _load(silent: true);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveOrder() async {
    final List<String> keys =
        _rows.map((Map<String, dynamic> r) => V.asString(r['prompt_key'])).toList();
    setState(() => _busy = true);
    try {
      await _api.reorderPrompts(keys);
      if (!mounted) return;
      showToast(context, 'Order saved');
      setState(() => _reordering = false);
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openRowMenu(Map<String, dynamic> row) {
    final bool featured = V.asBool(row['is_featured']);
    final bool premium = V.asBool(row['is_premium']);

    showModalBottomSheet<void>(
      context: context,
      builder: (BuildContext ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    V.asString(row['title']),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    V.asString(row['prompt_key']),
                    style: const TextStyle(color: AppTheme.textDim, fontSize: 12),
                  ),
                ],
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
              leading: Icon(
                featured ? Icons.star_rounded : Icons.star_outline_rounded,
                color: featured ? AppTheme.gold : null,
              ),
              title: Text(featured ? 'Remove from featured' : 'Mark as featured'),
              onTap: () {
                Navigator.of(ctx).pop();
                _toggle(row, 'is_featured');
              },
            ),
            ListTile(
              leading: Icon(
                premium ? Icons.lock_rounded : Icons.lock_open_rounded,
                color: premium ? AppTheme.gold : null,
              ),
              title: Text(premium ? 'Make free' : 'Make premium'),
              onTap: () {
                Navigator.of(ctx).pop();
                _toggle(row, 'is_premium');
              },
            ),
            ListTile(
              leading: const Icon(Icons.checklist_rounded),
              title: const Text('Select several'),
              onTap: () {
                Navigator.of(ctx).pop();
                setState(() {
                  _selecting = true;
                  _selected.add(V.asString(row['prompt_key']));
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: AppTheme.danger),
              title: const Text('Delete', style: TextStyle(color: AppTheme.danger)),
              onTap: () {
                Navigator.of(ctx).pop();
                _deleteOne(row);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // --- Build ----------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> rows = _visible;

    return Scaffold(
      body: Column(
        children: <Widget>[
          if (_selecting) _buildSelectionBar() else _buildFilterBar(),
          Expanded(child: _buildBody(rows)),
        ],
      ),
      floatingActionButton: (_selecting || _reordering)
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _edit(null),
              icon: const Icon(Icons.add_rounded),
              label: Text('New ${widget.listicles ? 'listicle' : 'prompt'}'),
            ),
    );
  }

  Widget _buildFilterBar() {
    return Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
          child: Row(
            children: <Widget>[
              Expanded(
                child: SearchBarField(
                  hint: 'Search title, ID or tags',
                  onChanged: (String value) => setState(() => _query = value),
                ),
              ),
              const SizedBox(width: 8),
              // Reordering writes sort_order for the whole list, so it only
              // makes sense against the unfiltered order.
              IconButton(
                tooltip: _reordering ? 'Save order' : 'Reorder',
                onPressed: _busy
                    ? null
                    : () {
                        if (_reordering) {
                          _saveOrder();
                        } else if (_query.isNotEmpty || _filter != _PromptFilter.all) {
                          showToast(context,
                              'Clear the search and filter first — reordering saves the whole list.',
                              error: true);
                        } else {
                          setState(() => _reordering = true);
                        }
                      },
                icon: Icon(
                  _reordering ? Icons.check_rounded : Icons.swap_vert_rounded,
                  color: _reordering ? AppTheme.success : AppTheme.textDim,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: <Widget>[
              _filterChip('All', _PromptFilter.all, _rows.length),
              _filterChip('Featured', _PromptFilter.featured,
                  _rows.where((Map<String, dynamic> r) => V.asBool(r['is_featured'])).length),
              _filterChip('Premium', _PromptFilter.premium,
                  _rows.where((Map<String, dynamic> r) => V.asBool(r['is_premium'])).length),
              _filterChip('Drafts', _PromptFilter.draft,
                  _rows.where((Map<String, dynamic> r) => V.asBool(r['is_draft'])).length),
            ],
          ),
        ),
        const SizedBox(height: 10),
      ],
    );
  }

  Widget _filterChip(String label, _PromptFilter value, int count) {
    final bool selected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppTheme.gold.withValues(alpha: 0.16) : AppTheme.surface,
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: selected ? AppTheme.gold : AppTheme.border),
          ),
          child: Text(
            '$label  $count',
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

  Widget _buildSelectionBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
      color: AppTheme.surface,
      child: Row(
        children: <Widget>[
          IconButton(
            onPressed: () => setState(() {
              _selecting = false;
              _selected.clear();
            }),
            icon: const Icon(Icons.close_rounded),
          ),
          Expanded(
            child: Text(
              '${_selected.length} selected',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          IconButton(
            tooltip: 'Hide',
            onPressed: _selected.isEmpty || _busy ? null : () => _bulkHide(true),
            icon: const Icon(Icons.visibility_off_outlined),
          ),
          IconButton(
            tooltip: 'Publish',
            onPressed: _selected.isEmpty || _busy ? null : () => _bulkHide(false),
            icon: const Icon(Icons.visibility_outlined),
          ),
          IconButton(
            tooltip: 'Delete',
            onPressed: _selected.isEmpty || _busy ? null : _bulkDelete,
            icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.danger),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(List<Map<String, dynamic>> rows) {
    if (_loading) return const LoadingState();
    if (_error != null) return ErrorStateView(message: _error!, onRetry: _load);
    if (_rows.isEmpty) {
      return EmptyState(
        icon: Icons.bolt_rounded,
        title: 'No ${_noun}s yet',
        message: 'Create the first one with the button below.',
      );
    }
    if (rows.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No matches',
        message: 'Nothing matches that search and filter.',
      );
    }

    if (_reordering) {
      return ReorderableListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
        itemCount: _rows.length,
        onReorder: (int oldIndex, int newIndex) {
          setState(() {
            if (newIndex > oldIndex) newIndex -= 1;
            final Map<String, dynamic> moved = _rows.removeAt(oldIndex);
            _rows.insert(newIndex, moved);
          });
        },
        itemBuilder: (BuildContext context, int index) {
          final Map<String, dynamic> row = _rows[index];
          return Padding(
            key: ValueKey<String>(V.asString(row['prompt_key'])),
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              child: ListTile(
                leading: RemoteThumb(url: V.asString(row['thumbnail_url']), size: 42),
                title: Text(
                  V.asString(row['title']),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  V.asString(row['prompt_key']),
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textDim),
                ),
                trailing: const Icon(Icons.drag_handle_rounded, color: AppTheme.textDim),
              ),
            ),
          );
        },
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
          final String key = V.asString(row['prompt_key']);
          return _PromptTile(
            row: row,
            selecting: _selecting,
            selected: _selected.contains(key),
            onTap: () {
              if (_selecting) {
                setState(() {
                  if (!_selected.remove(key)) _selected.add(key);
                });
              } else {
                _edit(row);
              }
            },
            onLongPress: () => _openRowMenu(row),
          );
        },
      ),
    );
  }
}

class _PromptTile extends StatelessWidget {
  const _PromptTile({
    required this.row,
    required this.selecting,
    required this.selected,
    required this.onTap,
    required this.onLongPress,
  });

  final Map<String, dynamic> row;
  final bool selecting;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final bool featured = V.asBool(row['is_featured']);
    final bool premium = V.asBool(row['is_premium']);
    final bool draft = V.asBool(row['is_draft']);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: selected ? AppTheme.gold : AppTheme.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              if (selecting) ...<Widget>[
                Icon(
                  selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                  color: selected ? AppTheme.gold : AppTheme.textDim,
                  size: 22,
                ),
                const SizedBox(width: 12),
              ] else ...<Widget>[
                RemoteThumb(url: V.asString(row['thumbnail_url'])),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      V.asString(row['title'], fallback: 'Untitled'),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 14.5, fontWeight: FontWeight.w600, height: 1.3),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: <Widget>[
                        Text(
                          V.asString(row['prompt_key']),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.textDim,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Icon(Icons.visibility_outlined, size: 12, color: AppTheme.textDim),
                        const SizedBox(width: 3),
                        Text(
                          V.compactNumber(row['view_count']),
                          style: const TextStyle(fontSize: 11, color: AppTheme.textDim),
                        ),
                        const SizedBox(width: 10),
                        const Icon(Icons.copy_rounded, size: 11, color: AppTheme.textDim),
                        const SizedBox(width: 3),
                        Text(
                          V.compactNumber(row['copy_count']),
                          style: const TextStyle(fontSize: 11, color: AppTheme.textDim),
                        ),
                      ],
                    ),
                    if (featured || premium || draft) ...<Widget>[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: <Widget>[
                          if (draft)
                            const StatusPill('DRAFT',
                                color: AppTheme.textDim, icon: Icons.visibility_off_outlined),
                          if (featured)
                            const StatusPill('FEATURED',
                                color: AppTheme.gold, icon: Icons.star_rounded),
                          if (premium)
                            const StatusPill('PREMIUM',
                                color: Color(0xFFF97316), icon: Icons.lock_rounded),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (!selecting)
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
