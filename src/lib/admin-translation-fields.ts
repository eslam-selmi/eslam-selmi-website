export type TextControl = HTMLInputElement | HTMLTextAreaElement;
export function editableTextControl(element: Element): element is TextControl {
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  return element instanceof HTMLInputElement && ["text", "search"].includes(element.type) && !element.disabled && !element.readOnly;
}
export function applyReviewedTranslation(field: TextControl, reviewed: string, original: string): boolean {
  if (!field.isConnected || field.disabled || field.readOnly || field.value !== original) return false;
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (!setter) return false;
  setter.call(field, reviewed);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}