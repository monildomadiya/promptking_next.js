import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/app_scope.dart';
import '../core/theme.dart';
import '../core/values.dart';
import '../services/admin_api.dart';
import '../widgets/common.dart';
import '../widgets/form_kit.dart';
import '../widgets/image_field.dart';

/// Create or edit one prompt (or listicle).
///
/// `save_prompt` writes the whole row on every call, so anything this screen
/// does not send comes back as null — which is why the starting map is the row
/// as it arrived, and the controllers only overwrite the keys they own.
class PromptEditor extends StatefulWidget {
  const PromptEditor({super.key, this.prompt, this.listicle = false});

  final Map<String, dynamic>? prompt;
  final bool listicle;

  @override
  State<PromptEditor> createState() => _PromptEditorState();
}

class _PromptEditorState extends State<PromptEditor> {
  late final AdminApi _api;

  final Map<String, TextEditingController> _c = <String, TextEditingController>{};

  /// The row as loaded, so untouched columns survive the round trip.
  late Map<String, dynamic> _row;

  List<Map<String, dynamic>> _subPrompts = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _faqs = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _categories = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _authors = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> _websiteCategories = <Map<String, dynamic>>[];

  String? _thumbnail;
  String? _imgBefore;
  String? _imgAfter;
  String? _ogImage;
  String? _twitterImage;
  String? _publishDate;
  String? _aiType;
  String? _authorId;
  String? _websiteCategoryId;
  String _imageRatio = '4 / 5';

  bool _isFeatured = false;
  bool _isPremium = false;
  bool _isSlider = false;
  bool _saving = false;
  bool _loadingRefs = true;
  String? _keyError;

  bool get _isNew => widget.prompt == null;
  String? get _originalKey =>
      _isNew ? null : V.asString(widget.prompt!['prompt_key']);

  @override
  void initState() {
    super.initState();
    _api = AppScope.apiOf(context);
    _row = <String, dynamic>{...?widget.prompt};

    for (final String field in <String>[
      'prompt_key', 'slug', 'title', 'description', 'tags', 'prompt_text',
      'ig_link', 'password', 'gallery_urls',
      'meta_title', 'meta_description', 'focus_keyword', 'canonical_url',
      'og_title', 'og_description', 'twitter_title', 'twitter_description',
    ]) {
      _c[field] = TextEditingController(text: V.asString(_row[field]));
    }

    _thumbnail = _nullIfBlank(V.asString(_row['thumbnail_url']));
    _imgBefore = _nullIfBlank(V.asString(_row['img_before']));
    _imgAfter = _nullIfBlank(V.asString(_row['img_after']));
    _ogImage = _nullIfBlank(V.asString(_row['og_image']));
    _twitterImage = _nullIfBlank(V.asString(_row['twitter_image']));
    _publishDate = _nullIfBlank(_dateOnly(_row['publish_date']));
    _aiType = _nullIfBlank(V.asString(_row['ai_type']));
    _authorId = _nullIfBlank(V.asString(_row['author_id']));
    _websiteCategoryId = _nullIfBlank(V.asString(_row['website_category_id']));
    _imageRatio = V.asString(_row['image_ratio'], fallback: '4 / 5');
    if (_imageRatio.isEmpty) _imageRatio = '4 / 5';

    _isFeatured = V.asBool(_row['is_featured']);
    _isPremium = V.asBool(_row['is_premium']);
    _isSlider = V.asBool(_row['is_image_slider']);

    _subPrompts = V.asMapList(_row['sub_prompts'])
        .map((Map<String, dynamic> e) => <String, dynamic>{...e})
        .toList();
    _faqs = V.asMapList(_row['faqs'])
        .map((Map<String, dynamic> e) => <String, dynamic>{...e})
        .toList();

    _loadRefs();
  }

  static String? _nullIfBlank(String value) => value.trim().isEmpty ? null : value.trim();

  /// `publish_date` arrives as a full ISO timestamp but the column is a DATE,
  /// and sending the timestamp back is a strict-mode truncation error.
  static String _dateOnly(dynamic value) {
    final String text = V.asString(value);
    if (text.isEmpty) return '';
    return text.length >= 10 ? text.substring(0, 10) : text;
  }

  Future<void> _loadRefs() async {
    try {
      final List<Map<String, dynamic>> categories = await _api.list('categories');
      final List<Map<String, dynamic>> authors = await _api.list('authors');
      final List<Map<String, dynamic>> websiteCategories =
          widget.listicle ? await _api.list('website_categories') : <Map<String, dynamic>>[];

      if (!mounted) return;
      setState(() {
        _categories = categories;
        _authors = authors;
        _websiteCategories = websiteCategories;
        // A brand new prompt should land on a real category rather than an
        // empty select that fails validation on save.
        _aiType ??= categories.isNotEmpty ? V.asString(categories.first['name']) : 'ChatGPT';
        _loadingRefs = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loadingRefs = false);
      showToast(context, 'Could not load categories: ${e.message}', error: true);
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
    final String title = _text('title');
    if (title.isEmpty) {
      showToast(context, 'A title is required.', error: true);
      return;
    }

    final String key = _text('prompt_key');
    if (key.isNotEmpty && !RegExp(r'^PK[0-9]+$').hasMatch(key)) {
      setState(() => _keyError = "Must be PK followed by numbers — PK001, say.");
      return;
    }
    setState(() {
      _keyError = null;
      _saving = true;
    });

    // Start from the loaded row so columns this screen never shows — view
    // counts, sort_order, is_draft — are not blanked by the save.
    final Map<String, dynamic> body = <String, dynamic>{
      ..._row,
      'prompt_key': key,
      'slug': _text('slug'),
      'title': title,
      'description': _text('description'),
      'tags': V.emptyToNull(_text('tags')),
      'prompt_text': _text('prompt_text'),
      'ai_type': _aiType ?? 'ChatGPT',
      'thumbnail_url': _thumbnail,
      'img_before': _imgBefore,
      'img_after': _imgAfter,
      'ig_link': _text('ig_link'),
      'is_image_slider': _isSlider,
      'image_ratio': _imageRatio,
      'gallery_urls': normaliseGalleryUrls(_text('gallery_urls')),
      'is_featured': _isFeatured,
      'is_premium': _isPremium,
      'password': _text('password'),
      'publish_date': _publishDate,
      'author_id': V.emptyToNull(_authorId ?? ''),
      'website_category_id': widget.listicle ? V.emptyToNull(_websiteCategoryId ?? '') : null,
      'sub_prompts': _subPrompts,
      'faqs': _faqs,
      'meta_title': _text('meta_title'),
      'meta_description': V.emptyToNull(_text('meta_description')),
      'focus_keyword': V.emptyToNull(_text('focus_keyword')),
      'canonical_url': V.emptyToNull(_text('canonical_url')),
      'og_title': V.emptyToNull(_text('og_title')),
      'og_description': V.emptyToNull(_text('og_description')),
      'og_image': _ogImage,
      'twitter_title': V.emptyToNull(_text('twitter_title')),
      'twitter_description': V.emptyToNull(_text('twitter_description')),
      'twitter_image': _twitterImage,
    };

    try {
      await _api.savePrompt(body, originalKey: _originalKey);
      if (!mounted) return;
      showToast(context, _isNew ? 'Created' : 'Saved');
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
    final String noun = widget.listicle ? 'listicle' : 'prompt';

    return Scaffold(
      appBar: AppBar(
        title: Text(_isNew ? 'New $noun' : 'Edit $noun'),
        actions: <Widget>[
          if (!_isNew)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Text(
                  V.asString(widget.prompt!['prompt_key']),
                  style: const TextStyle(
                    color: AppTheme.textDim,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _loadingRefs
          ? const LoadingState()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: <Widget>[
                FormSection(
                  title: 'Basics',
                  icon: Icons.edit_note_rounded,
                  children: <Widget>[
                    FormTextField(
                      label: 'Title',
                      controller: _c['title']!,
                      required: true,
                      hint: 'What the prompt is called on the site',
                    ),
                    FormTextField(
                      label: 'Prompt ID',
                      controller: _c['prompt_key']!,
                      hint: 'PK001',
                      errorText: _keyError,
                      textCapitalization: TextCapitalization.characters,
                      helper: _isNew
                          ? 'Leave empty and the server picks one. Format is PK plus digits.'
                          : 'Changing this changes the prompt URL.',
                    ),
                    FormTextField(
                      label: 'Slug',
                      controller: _c['slug']!,
                      hint: 'leave-empty-to-generate',
                      textCapitalization: TextCapitalization.none,
                      helper: 'Collisions are resolved server-side by adding -2.',
                    ),
                    FormTextField(
                      label: 'Description',
                      controller: _c['description']!,
                      maxLines: 5,
                      minLines: 3,
                      hint: 'The intro paragraph shown above the prompt',
                    ),
                    FormTextField(
                      label: 'Tags',
                      controller: _c['tags']!,
                      hint: 'AI portrait, Midjourney, photography',
                      helper: 'Comma separated.',
                    ),
                    FormDropdownField<String>(
                      label: 'AI type',
                      value: _aiType,
                      required: true,
                      onChanged: (String? value) => setState(() => _aiType = value),
                      items: _categories
                          .map((Map<String, dynamic> category) => DropdownMenuItem<String>(
                                value: V.asString(category['name']),
                                child: Text(V.asString(category['name'])),
                              ))
                          .toList(),
                      helper: 'Comes from the Categories section.',
                    ),
                    if (widget.listicle)
                      FormDropdownField<String>(
                        label: 'Website category',
                        value: _websiteCategoryId,
                        onChanged: (String? value) =>
                            setState(() => _websiteCategoryId = value),
                        items: _websiteCategories
                            .map((Map<String, dynamic> category) => DropdownMenuItem<String>(
                                  value: V.asString(category['id']),
                                  child: Text(V.asString(category['name'])),
                                ))
                            .toList(),
                        helper: 'What makes this a listicle rather than a prompt.',
                      ),
                    FormDropdownField<String>(
                      label: 'Author',
                      value: _authorId,
                      onChanged: (String? value) => setState(() => _authorId = value),
                      items: _authors
                          .map((Map<String, dynamic> author) => DropdownMenuItem<String>(
                                value: V.asString(author['id']),
                                child: Text(V.asString(author['name'])),
                              ))
                          .toList(),
                    ),
                    FormDateField(
                      label: 'Publish date',
                      value: _publishDate,
                      onChanged: (String? value) => setState(() => _publishDate = value),
                    ),
                  ],
                ),

                FormSection(
                  title: 'The prompt',
                  icon: Icons.bolt_rounded,
                  children: <Widget>[
                    FormTextField(
                      label: 'Prompt text',
                      controller: _c['prompt_text']!,
                      maxLines: 14,
                      minLines: 6,
                      hint: 'The text readers copy',
                      textCapitalization: TextCapitalization.none,
                    ),
                  ],
                ),

                _SubPromptsSection(
                  items: _subPrompts,
                  onChanged: (List<Map<String, dynamic>> items) =>
                      setState(() => _subPrompts = items),
                ),

                FormSection(
                  title: 'Media',
                  icon: Icons.image_outlined,
                  children: <Widget>[
                    ImageField(
                      label: 'Thumbnail',
                      value: _thumbnail,
                      onChanged: (String? url) => setState(() => _thumbnail = url),
                    ),
                    FormSwitchField(
                      label: 'Before / after slider',
                      value: _isSlider,
                      icon: Icons.compare_rounded,
                      description: 'Shows the two images below as a drag comparison.',
                      onChanged: (bool value) => setState(() => _isSlider = value),
                    ),
                    ImageField(
                      label: _isSlider ? 'Before image' : 'Secondary image',
                      value: _imgBefore,
                      onChanged: (String? url) => setState(() => _imgBefore = url),
                    ),
                    ImageField(
                      label: _isSlider ? 'After image' : 'Main image',
                      value: _imgAfter,
                      onChanged: (String? url) => setState(() => _imgAfter = url),
                    ),
                    _RatioPicker(
                      value: _imageRatio,
                      onChanged: (String value) => setState(() => _imageRatio = value),
                    ),
                    FormTextField(
                      label: 'Gallery URLs',
                      controller: _c['gallery_urls']!,
                      maxLines: 4,
                      minLines: 2,
                      textCapitalization: TextCapitalization.none,
                      hint: '["https://…", "https://…"]',
                      helper: 'A JSON array of image URLs. Leave as [] for none.',
                    ),
                    FormTextField(
                      label: 'Instagram link',
                      controller: _c['ig_link']!,
                      keyboardType: TextInputType.url,
                      textCapitalization: TextCapitalization.none,
                    ),
                  ],
                ),

                FormSection(
                  title: 'Visibility',
                  icon: Icons.visibility_outlined,
                  children: <Widget>[
                    FormSwitchField(
                      label: 'Featured',
                      value: _isFeatured,
                      icon: Icons.star_rounded,
                      description: 'Pins it to the featured row on the home page.',
                      onChanged: (bool value) => setState(() => _isFeatured = value),
                    ),
                    FormSwitchField(
                      label: 'Premium',
                      value: _isPremium,
                      icon: Icons.lock_rounded,
                      description: 'Readers need the unlock PIN below.',
                      onChanged: (bool value) => setState(() => _isPremium = value),
                    ),
                    if (_isPremium)
                      FormTextField(
                        label: 'Unlock PIN',
                        controller: _c['password']!,
                        keyboardType: TextInputType.number,
                        helper: 'Without a PIN a premium prompt cannot be opened at all.',
                      ),
                  ],
                ),

                FormSection(
                  title: 'SEO',
                  icon: Icons.travel_explore_rounded,
                  collapsible: true,
                  initiallyExpanded: false,
                  subtitle: 'Meta tags and canonical URL',
                  children: <Widget>[
                    FormTextField(label: 'Meta title', controller: _c['meta_title']!),
                    FormTextField(
                      label: 'Meta description',
                      controller: _c['meta_description']!,
                      maxLines: 4,
                      minLines: 2,
                    ),
                    FormTextField(label: 'Focus keyword', controller: _c['focus_keyword']!),
                    FormTextField(
                      label: 'Canonical URL',
                      controller: _c['canonical_url']!,
                      keyboardType: TextInputType.url,
                      textCapitalization: TextCapitalization.none,
                    ),
                  ],
                ),

                FormSection(
                  title: 'Social cards',
                  icon: Icons.share_outlined,
                  collapsible: true,
                  initiallyExpanded: false,
                  subtitle: 'Open Graph and Twitter',
                  children: <Widget>[
                    FormTextField(label: 'OG title', controller: _c['og_title']!),
                    FormTextField(
                      label: 'OG description',
                      controller: _c['og_description']!,
                      maxLines: 3,
                      minLines: 2,
                    ),
                    ImageField(
                      label: 'OG image',
                      value: _ogImage,
                      height: 120,
                      onChanged: (String? url) => setState(() => _ogImage = url),
                    ),
                    FormTextField(label: 'Twitter title', controller: _c['twitter_title']!),
                    FormTextField(
                      label: 'Twitter description',
                      controller: _c['twitter_description']!,
                      maxLines: 3,
                      minLines: 2,
                    ),
                    ImageField(
                      label: 'Twitter image',
                      value: _twitterImage,
                      height: 120,
                      onChanged: (String? url) => setState(() => _twitterImage = url),
                    ),
                  ],
                ),

                _FaqSection(
                  items: _faqs,
                  onChanged: (List<Map<String, dynamic>> items) => setState(() => _faqs = items),
                ),
              ],
            ),
      bottomNavigationBar: _loadingRefs
          ? null
          : SaveBar(
              onSave: _save,
              saving: _saving,
              label: _isNew ? 'Create $noun' : 'Save changes',
            ),
    );
  }
}

/// The aspect-ratio presets from the web modal, plus the custom field it keeps
/// beside them.
class _RatioPicker extends StatelessWidget {
  const _RatioPicker({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  static const List<String> _presets = <String>['1 / 1', '16 / 9', '4 / 5', '21 / 9', '4 / 3'];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const FieldLabel('Aspect ratio'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _presets.map((String ratio) {
            final bool selected = value == ratio;
            return GestureDetector(
              onTap: () => onChanged(ratio),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? AppTheme.gold.withValues(alpha: 0.16) : AppTheme.surfaceHigh,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(color: selected ? AppTheme.gold : AppTheme.border),
                ),
                child: Text(
                  ratio,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: selected ? AppTheme.gold : AppTheme.textDim,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (!_presets.contains(value))
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Custom: $value',
              style: const TextStyle(color: AppTheme.textDim, fontSize: 11.5),
            ),
          ),
      ],
    );
  }
}

/// Repeatable sub-prompts — `{title, prompt_text, imgBefore, imgAfter}`, the
/// shape the web modal writes and the prompt page reads.
class _SubPromptsSection extends StatelessWidget {
  const _SubPromptsSection({required this.items, required this.onChanged});

  final List<Map<String, dynamic>> items;
  final ValueChanged<List<Map<String, dynamic>>> onChanged;

  @override
  Widget build(BuildContext context) {
    return FormSection(
      title: 'Sub-prompts',
      icon: Icons.format_list_numbered_rounded,
      collapsible: true,
      initiallyExpanded: items.isNotEmpty,
      subtitle: items.isEmpty ? 'None' : '${items.length} added',
      children: <Widget>[
        for (int i = 0; i < items.length; i++)
          _RepeatableCard(
            // Keyed on the item itself, not on i: the inline fields seed their
            // controllers once, so with positional keys, deleting #1 would
            // leave #2's element in place still showing #1's text.
            key: ObjectKey(items[i]),
            index: i,
            onRemove: () {
              final List<Map<String, dynamic>> next = List<Map<String, dynamic>>.from(items)
                ..removeAt(i);
              onChanged(next);
            },
            children: <Widget>[
              _InlineField(
                label: 'Title',
                value: V.asString(items[i]['title']),
                onChanged: (String value) {
                  items[i]['title'] = value;
                  onChanged(items);
                },
              ),
              const SizedBox(height: 10),
              _InlineField(
                label: 'Prompt text',
                value: V.asString(items[i]['prompt_text']),
                maxLines: 6,
                onChanged: (String value) {
                  items[i]['prompt_text'] = value;
                  onChanged(items);
                },
              ),
            ],
          ),
        OutlinedButton.icon(
          onPressed: () {
            final List<Map<String, dynamic>> next = List<Map<String, dynamic>>.from(items)
              ..add(<String, dynamic>{
                'title': '',
                'prompt_text': '',
                'imgBefore': '',
                'imgAfter': '',
              });
            onChanged(next);
          },
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Add a sub-prompt'),
        ),
      ],
    );
  }
}

class _FaqSection extends StatelessWidget {
  const _FaqSection({required this.items, required this.onChanged});

  final List<Map<String, dynamic>> items;
  final ValueChanged<List<Map<String, dynamic>>> onChanged;

  @override
  Widget build(BuildContext context) {
    return FormSection(
      title: 'FAQs',
      icon: Icons.help_outline_rounded,
      collapsible: true,
      initiallyExpanded: items.isNotEmpty,
      subtitle: items.isEmpty ? 'None' : '${items.length} added',
      children: <Widget>[
        for (int i = 0; i < items.length; i++)
          _RepeatableCard(
            // Keyed on the item itself, not on i: the inline fields seed their
            // controllers once, so with positional keys, deleting #1 would
            // leave #2's element in place still showing #1's text.
            key: ObjectKey(items[i]),
            index: i,
            onRemove: () {
              final List<Map<String, dynamic>> next = List<Map<String, dynamic>>.from(items)
                ..removeAt(i);
              onChanged(next);
            },
            children: <Widget>[
              _InlineField(
                label: 'Question',
                value: V.asString(items[i]['question']),
                onChanged: (String value) {
                  items[i]['question'] = value;
                  onChanged(items);
                },
              ),
              const SizedBox(height: 10),
              _InlineField(
                label: 'Answer',
                value: V.asString(items[i]['answer']),
                maxLines: 5,
                onChanged: (String value) {
                  items[i]['answer'] = value;
                  onChanged(items);
                },
              ),
            ],
          ),
        OutlinedButton.icon(
          onPressed: () {
            final List<Map<String, dynamic>> next = List<Map<String, dynamic>>.from(items)
              ..add(<String, dynamic>{'question': '', 'answer': ''});
            onChanged(next);
          },
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Add an FAQ'),
        ),
      ],
    );
  }
}

class _RepeatableCard extends StatelessWidget {
  const _RepeatableCard({
    super.key,
    required this.index,
    required this.onRemove,
    required this.children,
  });

  final int index;
  final VoidCallback onRemove;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                '#${index + 1}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textDim,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: onRemove,
                child: const Icon(Icons.delete_outline_rounded,
                    size: 18, color: AppTheme.danger),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

/// A text field inside a repeatable card.
///
/// These are deliberately uncontrolled — the controller is seeded once from the
/// list and never re-seeded. Rebuilding a controller from the parent's state on
/// every keystroke is what puts the caret back at position zero mid-word.
class _InlineField extends StatefulWidget {
  const _InlineField({
    required this.label,
    required this.value,
    required this.onChanged,
    this.maxLines = 1,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  final int maxLines;

  @override
  State<_InlineField> createState() => _InlineFieldState();
}

class _InlineFieldState extends State<_InlineField> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.value);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(widget.label),
        const SizedBox(height: 6),
        TextField(
          controller: _controller,
          onChanged: widget.onChanged,
          maxLines: widget.maxLines,
          minLines: widget.maxLines > 1 ? 2 : 1,
          style: const TextStyle(fontSize: 14, height: 1.4),
          decoration: const InputDecoration(isDense: true),
        ),
      ],
    );
  }
}

/// Kept so `gallery_urls` round-trips as valid JSON even when someone types
/// into the field by hand.
String normaliseGalleryUrls(String raw) {
  final String text = raw.trim();
  if (text.isEmpty) return '[]';
  try {
    final dynamic decoded = jsonDecode(text);
    if (decoded is List) return jsonEncode(decoded);
  } catch (_) {
    // Fall through — a newline or comma list is the other thing people paste.
  }
  final List<String> parts = text
      .split(RegExp(r'[\n,]'))
      .map((String s) => s.trim())
      .where((String s) => s.isNotEmpty)
      .toList();
  return jsonEncode(parts);
}
