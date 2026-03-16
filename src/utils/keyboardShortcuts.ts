export const LETTER_SHORTCUTS = 'asdfghjklqwertyuiopzxcvbnm'.split('');
export const EXTENDED_SHORTCUTS = '1234567890qwertyuiopasdfghjklzxcvbnm,./'.split('');

interface ShortcutMaps<T> {
  keyToItem: Record<string, T>;
  idToShortcut: Record<string, string>;
}

export function createKeyboardShortcutMaps<T>(
  items: T[],
  shortcuts: readonly string[],
  getId: (item: T) => string,
): ShortcutMaps<T> {
  const keyToItem: Record<string, T> = {};
  const idToShortcut: Record<string, string> = {};

  items.forEach((item, index) => {
    const shortcut = shortcuts[index];
    if (!shortcut) return;

    const normalizedShortcut = shortcut.toLowerCase();
    keyToItem[normalizedShortcut] = item;
    idToShortcut[getId(item)] = normalizedShortcut.toUpperCase();
  });

  return { keyToItem, idToShortcut };
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}