import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import '../widgets/form_kit.dart';
import '../widgets/image_field.dart';

/// Create or edit one wallpaper.
///
/// `save_wallpaper` rejects a row without a title or an image, so both are
/// checked here first — a 400 that arrives after the image has already
/// uploaded is a confusing way to learn the title box was empty.
class WallpaperEditor extends StatefulWidget {
  const WallpaperEditor({super.key, this.wallpaper});

  final Map<String, dynamic>? wallpaper;

  @override
  State<WallpaperEditor> createState() => _WallpaperEditorState();
}

class _WallpaperEditorState extends State<WallpaperEditor> {
  late final AdminApi _api;
  final Map<String, TextEditingController> _c = <String, TextEditingController>{};

  late Map<String, dynamic> _row;
  List<Map<String, dynamic>> _categories = <Map<String, dynamic>>[];

  String? _imageUrl;
  String? _categoryId;
  String? _publishDate;
  String _orientation = 'both';
  bool _isFeatured = false;
  bool _isDraft = false;
  bool _saving = false;
  bool _loadingRefs = true;

  bool get _isNew => widget.wallpaper == null;

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _row = <String, dynamic>{...?widget.wallpaper};

    for (final String field in <String>[
      'title', 'slug', 'description', 'tags', 'prompt_key',
      'width', 'height', 'sort_order', 'meta_title', 'meta_description',
    ]) {
      _c[field] = TextEditingController(text: V.asString(_row[field]));
    }

    _imageUrl = _blankToNull(V.asString(_row['image_url']));
    _categoryId = _blankToNull(V.asString(_row['category_id']));
    _publishDate = _blankToNull(_dateOnly(_row['publish_date']));
    _orientation = V.asString(_row['orientation'], fallback: 'both');
    if (!<String>['phone', 'desktop', 'both'].contains(_orientation)) {
      _orientation = 'both';
    }
    _isFeatured = V.asBool(_row['is_featured']);
    _isDraft = V.asBool(_row['is_draft']);

    _loadCategories();
  }

  static String? _blankToNull(String value) => value.trim().isEmpty ? null : value.trim();

  static String _dateOnly(dynamic value) {
    final String text = V.asString(value);
    if (text.isEmpty) return '';
    return text.length >= 10 ? text.substring(0, 10) : text;
  }

  Future<void> _loadCategories() async {
    try {
      final List<Map<String, dynamic>> categories = await _api.list('wallpaper_categories');
      if (!mounted) return;
      setState(() {
        _categories = categories;
        _loadingRefs = false;
      });
    } on ApiException {
      if (mounted) setState(() => _loadingRefs = false);
    }
  }

  @override
  void dispose() {
    for (final TextEditingController controller in _c.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String _text(String field) => _c[field]!.text.trim();

  Future<void> _save() async {
    if (_text('title').isEmpty) {
      showToast(context, 'A title is required.', error: true);
      return;
    }
    if (_imageUrl == null || _imageUrl!.isEmpty) {
      showToast(context, 'An image is required.', error: true);
      return;
    }

    setState(() => _saving = true);

    final Map<String, dynamic> body = <String, dynamic>{
      ..._row,
      'id': _row['id'],
      'title': _text('title'),
      'slug': V.emptyToNull(_text('slug')),
      'description': V.emptyToNull(_text('description')),
      'image_url': _imageUrl,
      'orientation': _orientation,
      'width': V.asIntOrNull(_text('width')),
      'height': V.asIntOrNull(_text('height')),
      'tags': V.emptyToNull(_text('tags')),
      'prompt_key': V.emptyToNull(_text('prompt_key')),
      'category_id': V.emptyToNull(_categoryId ?? ''),
      'is_featured': _isFeatured,
      'is_draft': _isDraft,
      'sort_order': V.asInt(_text('sort_order')),
      'meta_title': V.emptyToNull(_text('meta_title')),
      'meta_description': V.emptyToNull(_text('meta_description')),
      'publish_date': _publishDate,
    };

    try {
      await _api.saveWallpaper(body);
      if (!mounted) return;
      showToast(context, _isNew ? 'Wallpaper added' : 'Saved');
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) {
        showToast(context, e.message, error: true);
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isNew ? 'New wallpaper' : 'Edit wallpaper')),
      body: _loadingRefs
          ? const LoadingState()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: <Widget>[
                FormSection(
                  title: 'Image',
                  icon: Icons.wallpaper_rounded,
                  children: <Widget>[
                    ImageField(
                      label: 'Wallpaper',
                      value: _imageUrl,
                      height: 220,
                      onChanged: (String? url) => setState(() => _imageUrl = url),
                      helper: 'Importing from a link keeps the file off this phone — '
                          'the server fetches and re-hosts it.',
                    ),
                    FormDropdownField<String>(
                      label: 'Orientation',
                      value: _orientation,
                      onChanged: (String? value) =>
                          setState(() => _orientation = value ?? 'both'),
                      items: const <DropdownMenuItem<String>>[
                        DropdownMenuItem<String>(value: 'both', child: Text('Both')),
                        DropdownMenuItem<String>(value: 'phone', child: Text('Phone')),
                        DropdownMenuItem<String>(value: 'desktop', child: Text('Desktop')),
                      ],
                    ),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: FormTextField(
                            label: 'Width',
                            controller: _c['width']!,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FormTextField(
                            label: 'Height',
                            controller: _c['height']!,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                FormSection(
                  title: 'Details',
                  icon: Icons.edit_note_rounded,
                  children: <Widget>[
                    FormTextField(
                      label: 'Title',
                      controller: _c['title']!,
                      required: true,
                    ),
                    FormTextField(
                      label: 'Slug',
                      controller: _c['slug']!,
                      textCapitalization: TextCapitalization.none,
                      helper: 'Left empty, it comes from the title. Collisions get -2.',
                    ),
                    FormTextField(
                      label: 'Description',
                      controller: _c['description']!,
                      maxLines: 4,
                      minLines: 2,
                    ),
                    FormTextField(
                      label: 'Tags',
                      controller: _c['tags']!,
                      helper: 'Comma separated.',
                    ),
                    FormDropdownField<String>(
                      label: 'Category',
                      value: _categoryId,
                      onChanged: (String? value) => setState(() => _categoryId = value),
                      items: _categories
                          .map((Map<String, dynamic> category) => DropdownMenuItem<String>(
                                value: V.asString(category['id']),
                                child: Text(V.asString(category['name'])),
                              ))
                          .toList(),
                    ),
                    FormTextField(
                      label: 'Linked prompt ID',
                      controller: _c['prompt_key']!,
                      hint: 'PK001',
                      textCapitalization: TextCapitalization.characters,
                      helper: 'Shows the prompt that made this image, if there is one.',
                    ),
                  ],
                ),

                FormSection(
                  title: 'Publishing',
                  icon: Icons.visibility_outlined,
                  children: <Widget>[
                    FormSwitchField(
                      label: 'Draft',
                      value: _isDraft,
                      icon: Icons.visibility_off_outlined,
                      description: 'Hidden from the site and left out of the sitemap.',
                      onChanged: (bool value) => setState(() => _isDraft = value),
                    ),
                    FormSwitchField(
                      label: 'Featured',
                      value: _isFeatured,
                      icon: Icons.star_rounded,
                      onChanged: (bool value) => setState(() => _isFeatured = value),
                    ),
                    FormDateField(
                      label: 'Publish date',
                      value: _publishDate,
                      onChanged: (String? value) => setState(() => _publishDate = value),
                    ),
                    FormTextField(
                      label: 'Sort order',
                      controller: _c['sort_order']!,
                      keyboardType: TextInputType.number,
                      helper: 'Lower numbers come first in the grid.',
                    ),
                  ],
                ),

                FormSection(
                  title: 'SEO',
                  icon: Icons.travel_explore_rounded,
                  collapsible: true,
                  initiallyExpanded: false,
                  children: <Widget>[
                    FormTextField(label: 'Meta title', controller: _c['meta_title']!),
                    FormTextField(
                      label: 'Meta description',
                      controller: _c['meta_description']!,
                      maxLines: 4,
                      minLines: 2,
                    ),
                  ],
                ),
              ],
            ),
      bottomNavigationBar: _loadingRefs
          ? null
          : SaveBar(
              onSave: _save,
              saving: _saving,
              label: _isNew ? 'Add wallpaper' : 'Save changes',
            ),
    );
  }
}
