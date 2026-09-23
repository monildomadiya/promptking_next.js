import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/theme.dart';

/// Form controls for the edit screens.
///
/// The web panel lays a prompt out as a wide grid of inputs; on a phone the
/// same fields have to become one column of labelled cards, grouped so that
/// the SEO half can be collapsed out of the way of the half anyone actually
/// edits on a phone.

/// A titled group of fields. [initiallyExpanded] is false for the sections
/// that exist for completeness — meta tags, Open Graph — so the screen opens
/// on the fields that matter rather than on a wall of empty inputs.
class FormSection extends StatelessWidget {
  const FormSection({
    super.key,
    required this.title,
    required this.children,
    this.icon,
    this.collapsible = false,
    this.initiallyExpanded = true,
    this.subtitle,
  });

  final String title;
  final List<Widget> children;
  final IconData? icon;
  final bool collapsible;
  final bool initiallyExpanded;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final Widget body = Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: _spaced(children),
      ),
    );

    final Widget header = Row(
      children: <Widget>[
        if (icon != null) ...<Widget>[
          Icon(icon, size: 18, color: AppTheme.gold),
          const SizedBox(width: 10),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    subtitle!,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textDim),
                  ),
                ),
            ],
          ),
        ),
      ],
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: collapsible
          ? Theme(
              // The default ExpansionTile paints its own divider lines, which
              // read as a second border inside the card.
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: initiallyExpanded,
                tilePadding: const EdgeInsets.symmetric(horizontal: 16),
                childrenPadding: EdgeInsets.zero,
                shape: const Border(),
                collapsedShape: const Border(),
                title: header,
                children: <Widget>[body],
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                  child: header,
                ),
                body,
              ],
            ),
    );
  }

  static List<Widget> _spaced(List<Widget> items) {
    final List<Widget> out = <Widget>[];
    for (int i = 0; i < items.length; i++) {
      out.add(items[i]);
      if (i != items.length - 1) out.add(const SizedBox(height: 14));
    }
    return out;
  }
}

/// A labelled text input. [helper] carries the things the web panel puts in a
/// tooltip — the PK-key format rule, what a slug collision does — because a
/// phone has no hover.
class FormTextField extends StatelessWidget {
  const FormTextField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.helper,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.required = false,
    this.errorText,
    this.onChanged,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.sentences,
    this.suffix,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? helper;
  final int maxLines;
  final int? minLines;
  final TextInputType? keyboardType;
  final bool required;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(label, required: required),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          minLines: minLines,
          keyboardType: keyboardType,
          onChanged: onChanged,
          inputFormatters: inputFormatters,
          textCapitalization: textCapitalization,
          style: const TextStyle(fontSize: 14.5, height: 1.4),
          decoration: InputDecoration(
            hintText: hint,
            errorText: errorText,
            helperText: helper,
            helperMaxLines: 3,
            helperStyle: const TextStyle(color: AppTheme.textDim, fontSize: 11.5, height: 1.35),
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}

class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key, this.required = false});

  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDim,
            letterSpacing: 0.3,
          ),
        ),
        if (required)
          const Text(' *', style: TextStyle(color: AppTheme.danger, fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class FormSwitchField extends StatelessWidget {
  const FormSwitchField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.description,
    this.icon,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String? description;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: <Widget>[
            if (icon != null) ...<Widget>[
              Icon(icon, size: 18, color: value ? AppTheme.gold : AppTheme.textDim),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  if (description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        description!,
                        style: const TextStyle(fontSize: 11.5, color: AppTheme.textDim, height: 1.3),
                      ),
                    ),
                ],
              ),
            ),
            Switch(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

class FormDropdownField<T> extends StatelessWidget {
  const FormDropdownField({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.helper,
    this.required = false,
  });

  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? helper;
  final bool required;

  @override
  Widget build(BuildContext context) {
    // A value that is no longer in the list (a category deleted on the web
    // panel while this screen was open) makes DropdownButton assert.
    final bool valueIsKnown =
        value == null || items.any((DropdownMenuItem<T> item) => item.value == value);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(label, required: required),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceHigh,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: valueIsKnown ? value : null,
              items: items,
              onChanged: onChanged,
              isExpanded: true,
              dropdownColor: AppTheme.surfaceHigh,
              borderRadius: BorderRadius.circular(12),
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textDim),
              style: const TextStyle(fontSize: 14.5, color: AppTheme.textMain),
              hint: const Text('Select', style: TextStyle(color: Color(0xFF6B7484), fontSize: 14.5)),
            ),
          ),
        ),
        if (helper != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              helper!,
              style: const TextStyle(color: AppTheme.textDim, fontSize: 11.5),
            ),
          ),
      ],
    );
  }
}

/// A date field that writes `YYYY-MM-DD`, the shape the save routes hand to
/// MySQL DATE columns. Typing a date on a phone keyboard is worse than picking
/// one, and a half-typed date is a strict-mode error.
class FormDateField extends StatelessWidget {
  const FormDateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.helper,
  });

  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;
  final String? helper;

  @override
  Widget build(BuildContext context) {
    final DateTime? parsed = (value == null || value!.isEmpty) ? null : DateTime.tryParse(value!);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        FieldLabel(label),
        const SizedBox(height: 6),
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            final DateTime now = DateTime.now();
            final DateTime? picked = await showDatePicker(
              context: context,
              initialDate: parsed ?? now,
              firstDate: DateTime(now.year - 5),
              lastDate: DateTime(now.year + 5),
            );
            if (picked != null) {
              final String month = picked.month.toString().padLeft(2, '0');
              final String day = picked.day.toString().padLeft(2, '0');
              onChanged('${picked.year}-$month-$day');
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
            decoration: BoxDecoration(
              color: AppTheme.surfaceHigh,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: <Widget>[
                const Icon(Icons.event_rounded, size: 18, color: AppTheme.textDim),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    (value == null || value!.isEmpty) ? 'Not scheduled' : value!,
                    style: TextStyle(
                      fontSize: 14.5,
                      color: (value == null || value!.isEmpty)
                          ? AppTheme.textDim
                          : AppTheme.textMain,
                    ),
                  ),
                ),
                if (value != null && value!.isNotEmpty)
                  GestureDetector(
                    onTap: () => onChanged(null),
                    child: const Icon(Icons.close_rounded, size: 18, color: AppTheme.textDim),
                  ),
              ],
            ),
          ),
        ),
        if (helper != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              helper!,
              style: const TextStyle(color: AppTheme.textDim, fontSize: 11.5),
            ),
          ),
      ],
    );
  }
}

/// The bar that sits at the bottom of every edit screen. Full width, thumb
/// height, and it says what it is saving rather than just "Save".
class SaveBar extends StatelessWidget {
  const SaveBar({
    super.key,
    required this.onSave,
    required this.saving,
    this.label = 'Save',
    this.secondary,
    this.includeSafeArea = true,
  });

  final VoidCallback onSave;
  final bool saving;
  final String label;
  final Widget? secondary;

  /// False when this bar sits inside a nested Scaffold whose parent already
  /// has a bottom bar — the system inset is consumed once, down there, and
  /// adding it again leaves a band of dead space above it.
  final bool includeSafeArea;

  @override
  Widget build(BuildContext context) {
    final double inset =
        includeSafeArea ? MediaQuery.of(context).padding.bottom : 0;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + inset),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: Row(
        children: <Widget>[
          if (secondary != null) ...<Widget>[secondary!, const SizedBox(width: 12)],
          Expanded(
            child: FilledButton(
              onPressed: saving ? null : onSave,
              child: saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Color(0xFF1A1206),
                      ),
                    )
                  : Text(label),
            ),
          ),
        ],
      ),
    );
  }
}
