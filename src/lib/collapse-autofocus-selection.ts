/**
 * Dialogs (e.g. Radix) and some browsers move focus to the first field with the full value
 * selected, which looks like a harsh “highlight”. When the entire value is selected on focus,
 * move the caret to the end so typing appends normally.
 */
export function collapseAutofocusFullSelection(el: HTMLInputElement | HTMLTextAreaElement): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (document.activeElement !== el) return;
      const len = el.value.length;
      if (len === 0) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (start === 0 && end === len) {
        el.setSelectionRange(len, len);
      }
    });
  });
}
