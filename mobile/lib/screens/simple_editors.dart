import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import '../widgets/form_kit.dart';
import '../widgets/image_field.dart';

/// The five small forms: prompt categories, wallpaper categories, website
/// categories, authors and FAQs.
///
/// Each is a handful of fields over a single `save_*` route, so they share one
/// shell — [_EditorShell] — and differ only in what they put inside it and what
/// they send. Every one starts from the row it was opened with, so columns the
/// form does not show survive the save.

/// Scaffold, save bar, error toast. The body is the caller's.
class _EditorShell extends StatelessWidget {
  const _EditorShell({
    required this.title,
    required this.saving,
    required this.onSave,
    required this.children,
    required this.saveLabel,
  });

  final String title;
  final bool saving;
  final VoidCallback onSave;
  final List<Widget> children;
  final String saveLabel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: children,
      ),
      bottomNavigationBar: SaveBar(onSave: onSave, saving: saving, label: saveLabel),
    );
  }
}

/// Slug helper shared by the three category forms. The save routes resolve
/// collisions themselves, so this only has to produce something reasonable.
String slugify(String value) {
  return value
      .toLowerCase()
      .replaceAll('&', ' and ')
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
}

// --- Prompt categories -------------------------------------------------------

class CategoryEditor extends StatefulWidget {
  const CategoryEditor({super.key, this.category});

  final Map<String, dynamic>? category;

  @override
  State<CategoryEditor> createState() => _CategoryEditorState();
}

class _CategoryEditorState extends State<CategoryEditor> {
  late final AdminApi _api = AppScope.apiOf(context);
  late final Map<String, dynamic> _row = <String, dynamic>{...?widget.category};

  late final TextEditingController _name =
      TextEditingController(text: V.asString(_row['name']));
  late final TextEditingController _slug =
      TextEditingController(text: V.asString(_row['slug']));
  late final TextEditingController _description =
      TextEditingController(text: V.asString(_row['description']));

  late String? _image = V.asString(_row['image_url']).isEmpty
      ? (V.asString(_row['image']).isEmpty ? null : V.asString(_row['image']))
      : V.asString(_row['image_url']);

  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      showToast(context, 'A name is required.', error: true);
      return;
    }
    setState(() => _saving = true);

    try {
      await _api.saveCategory(<String, dynamic>{
        ..._row,
        'id': _row['id'],
        'name': _name.text.trim(),
        'slug': _slug.text.trim().isEmpty ? slugify(_name.text) : _slug.text.trim(),
        'description': V.emptyToNull(_description.text),
        // The route writes `image`; the site renders `image_url`. Sending both
        // keeps this form correct whichever column the row actually uses.
        'image': _image,
        'image_url': _image,
      });
      if (!mounted) return;
      showToast(context, 'Saved');
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
    return _EditorShell(
      title: widget.category == null ? 'New category' : 'Edit category',
      saving: _saving,
      onSave: _save,
      saveLabel: widget.category == null ? 'Create category' : 'Save changes',
      children: <Widget>[
        FormSection(
          title: 'Category',
          icon: Icons.category_outlined,
          children: <Widget>[
            FormTextField(label: 'Name', controller: _name, required: true),
            FormTextField(
              label: 'Slug',
              controller: _slug,
              textCapitalization: TextCapitalization.none,
              helper: 'Left empty, it comes from the name.',
            ),
            FormTextField(
              label: 'Description',
              controller: _description,
              maxLines: 4,
              minLines: 2,
            ),
            ImageField(
              label: 'Image',
              value: _image,
              height: 130,
              onChanged: (String? url) => setState(() => _image = url),
            ),
          ],
        ),
      ],
    );
  }
}

// --- Wallpaper categories ----------------------------------------------------

class WallpaperCategoryEditor extends StatefulWidget {
  const WallpaperCategoryEditor({super.key, this.category});

  final Map<String, dynamic>? category;

  @override
  State<WallpaperCategoryEditor> createState() => _WallpaperCategoryEditorState();
}

class _WallpaperCategoryEditorState extends State<WallpaperCategoryEditor> {
  late final AdminApi _api = AppScope.apiOf(context);
  late final Map<String, dynamic> _row = <String, dynamic>{...?widget.category};

  late final TextEditingController _name =
      TextEditingController(text: V.asString(_row['name']));
  late final TextEditingController _slug =
      TextEditingController(text: V.asString(_row['slug']));
  late final TextEditingController _description =
      TextEditingController(text: V.asString(_row['description']));
  late final TextEditingController _sortOrder =
      TextEditingController(text: V.asString(_row['sort_order'], fallback: '0'));

  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _description.dispose();
    _sortOrder.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      showToast(context, 'A name is required.', error: true);
      return;
    }
    setState(() => _saving = true);

    try {
      await _api.saveWallpaperCategory(<String, dynamic>{
        ..._row,
        'id': _row['id'],
        'name': _name.text.trim(),
        'slug': _slug.text.trim(),
        'description': V.emptyToNull(_description.text),
        'sort_order': V.asInt(_sortOrder.text),
      });
      if (!mounted) return;
      showToast(context, 'Saved');
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
    return _EditorShell(
      title: widget.category == null ? 'New wallpaper category' : 'Edit category',
      saving: _saving,
      onSave: _save,
      saveLabel: widget.category == null ? 'Create category' : 'Save changes',
      children: <Widget>[
        FormSection(
          title: 'Category',
          icon: Icons.collections_outlined,
          children: <Widget>[
            FormTextField(label: 'Name', controller: _name, required: true),
            FormTextField(
              label: 'Slug',
              controller: _slug,
              textCapitalization: TextCapitalization.none,
              helper: 'Left empty, it comes from the name.',
            ),
            FormTextField(
              label: 'Description',
              controller: _description,
              maxLines: 4,
              minLines: 2,
            ),
            FormTextField(
              label: 'Sort order',
              controller: _sortOrder,
              keyboardType: TextInputType.number,
              helper: 'Lower numbers come first in the category row.',
            ),
          ],
        ),
      ],
    );
  }
}

// --- Website categories ------------------------------------------------------

class WebsiteCategoryEditor extends StatefulWidget {
  const WebsiteCategoryEditor({super.key, this.category});

  final Map<String, dynamic>? category;

  @override
  State<WebsiteCategoryEditor> createState() => _WebsiteCategoryEditorState();
}

class _WebsiteCategoryEditorState extends State<WebsiteCategoryEditor> {
  late final AdminApi _api = AppScope.apiOf(context);
  late final Map<String, dynamic> _row = <String, dynamic>{...?widget.category};

  final Map<String, TextEditingController> _c = <String, TextEditingController>{};
  String? _image;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    for (final String field in <String>[
      'name', 'slug', 'description', 'tag', 'meta_title', 'meta_description', 'focus_keyword',
    ]) {
      _c[field] = TextEditingController(text: V.asString(_row[field]));
    }
    final String image = V.asString(_row['image_url']);
    _image = image.isEmpty ? null : image;
  }

  @override
  void dispose() {
    for (final TextEditingController controller in _c.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_c['name']!.text.trim().isEmpty) {
      showToast(context, 'A name is required.', error: true);
      return;
    }
    setState(() => _saving = true);

    try {
      await _api.saveWebsiteCategory(<String, dynamic>{
        ..._row,
        'id': _row['id'],
        'name': _c['name']!.text.trim(),
        'slug': _c['slug']!.text.trim().isEmpty
            ? slugify(_c['name']!.text)
            : _c['slug']!.text.trim(),
        'description': V.emptyToNull(_c['description']!.text),
        'image_url': _image,
        'tag': V.emptyToNull(_c['tag']!.text),
        'meta_title': V.emptyToNull(_c['meta_title']!.text),
        'meta_description': V.emptyToNull(_c['meta_description']!.text),
        'focus_keyword': V.emptyToNull(_c['focus_keyword']!.text),
      });
      if (!mounted) return;
      showToast(context, 'Saved');
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
    return _EditorShell(
      title: widget.category == null ? 'New website category' : 'Edit website category',
      saving: _saving,
      onSave: _save,
      saveLabel: widget.category == null ? 'Create category' : 'Save changes',
      children: <Widget>[
        FormSection(
          title: 'Category',
          icon: Icons.layers_outlined,
          children: <Widget>[
            FormTextField(label: 'Name', controller: _c['name']!, required: true),
            FormTextField(
              label: 'Slug',
              controller: _c['slug']!,
              textCapitalization: TextCapitalization.none,
            ),
            FormTextField(
              label: 'Description',
              controller: _c['description']!,
              maxLines: 4,
              minLines: 2,
            ),
            FormTextField(
              label: 'Tag',
              controller: _c['tag']!,
              helper: 'The badge shown on the category card.',
            ),
            ImageField(
              label: 'Image',
              value: _image,
              height: 130,
              onChanged: (String? url) => setState(() => _image = url),
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
            FormTextField(label: 'Focus keyword', controller: _c['focus_keyword']!),
          ],
        ),
      ],
    );
  }
}

// --- Authors -----------------------------------------------------------------

class AuthorEditor extends StatefulWidget {
  const AuthorEditor({super.key, this.author});

  final Map<String, dynamic>? author;

  @override
  State<AuthorEditor> createState() => _AuthorEditorState();
}

class _AuthorEditorState extends State<AuthorEditor> {
  late final AdminApi _api = AppScope.apiOf(context);
  late final Map<String, dynamic> _row = <String, dynamic>{...?widget.author};

  late final TextEditingController _name =
      TextEditingController(text: V.asString(_row['name']));
  late final TextEditingController _description =
      TextEditingController(text: V.asString(_row['description']));

  late String? _image =
      V.asString(_row['image']).isEmpty ? null : V.asString(_row['image']);
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      showToast(context, 'A name is required.', error: true);
      return;
    }
    setState(() => _saving = true);

    try {
      await _api.saveAuthor(<String, dynamic>{
        ..._row,
        'id': _row['id'],
        'name': _name.text.trim(),
        'image': _image,
        'description': V.emptyToNull(_description.text),
      });
      if (!mounted) return;
      // Every post this author wrote carries a copy of their name and photo,
      // and the route republishes the blog cache for exactly that reason.
      showToast(context, 'Saved — posts by this author were refreshed');
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
    return _EditorShell(
      title: widget.author == null ? 'New author' : 'Edit author',
      saving: _saving,
      onSave: _save,
      saveLabel: widget.author == null ? 'Create author' : 'Save changes',
      children: <Widget>[
        FormSection(
          title: 'Author',
          icon: Icons.person_outline_rounded,
          children: <Widget>[
            ImageField(
              label: 'Photo',
              value: _image,
              height: 130,
              onChanged: (String? url) => setState(() => _image = url),
            ),
            FormTextField(label: 'Name', controller: _name, required: true),
            FormTextField(
              label: 'Bio',
              controller: _description,
              maxLines: 5,
              minLines: 3,
              helper: 'Shown under every post this author is credited on.',
            ),
          ],
        ),
      ],
    );
  }
}

// --- FAQs --------------------------------------------------------------------

class FaqEditor extends StatefulWidget {
  const FaqEditor({super.key, this.faq});

  final Map<String, dynamic>? faq;

  @override
  State<FaqEditor> createState() => _FaqEditorState();
}

class _FaqEditorState extends State<FaqEditor> {
  late final AdminApi _api = AppScope.apiOf(context);
  late final Map<String, dynamic> _row = <String, dynamic>{...?widget.faq};

  late final TextEditingController _question =
      TextEditingController(text: V.asString(_row['question']));
  late final TextEditingController _answer =
      TextEditingController(text: V.asString(_row['answer']));
  late final TextEditingController _order =
      TextEditingController(text: V.asString(_row['order_num'], fallback: '0'));

  late bool _active = widget.faq == null ? true : V.asBool(_row['is_active']);
  bool _saving = false;

  @override
  void dispose() {
    _question.dispose();
    _answer.dispose();
    _order.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_question.text.trim().isEmpty) {
      showToast(context, 'A question is required.', error: true);
      return;
    }
    setState(() => _saving = true);

    try {
      await _api.saveFaq(<String, dynamic>{
        ..._row,
        'id': _row['id'],
        'question': _question.text.trim(),
        'answer': _answer.text.trim(),
        'order_num': V.asInt(_order.text),
        'is_active': _active ? 1 : 0,
      });
      if (!mounted) return;
      showToast(context, 'Saved');
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
    return _EditorShell(
      title: widget.faq == null ? 'New FAQ' : 'Edit FAQ',
      saving: _saving,
      onSave: _save,
      saveLabel: widget.faq == null ? 'Create FAQ' : 'Save changes',
      children: <Widget>[
        FormSection(
          title: 'FAQ',
          icon: Icons.help_outline_rounded,
          children: <Widget>[
            FormTextField(
              label: 'Question',
              controller: _question,
              required: true,
              maxLines: 2,
              minLines: 1,
            ),
            FormTextField(
              label: 'Answer',
              controller: _answer,
              maxLines: 8,
              minLines: 4,
            ),
            FormTextField(
              label: 'Order',
              controller: _order,
              keyboardType: TextInputType.number,
              helper: 'Lower numbers appear first.',
            ),
            FormSwitchField(
              label: 'Active',
              value: _active,
              icon: Icons.visibility_outlined,
              description: 'Inactive FAQs stay in the table but off the site.',
              onChanged: (bool value) => setState(() => _active = value),
            ),
          ],
        ),
      ],
    );
  }
}
