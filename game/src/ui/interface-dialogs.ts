import { element } from './dom.ts';

export function bindInterfaceDialogs(signal: AbortSignal) {
  const options = { signal };
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-dialog]')) {
    const dialog = element<HTMLDialogElement>(button.dataset.dialog!);
    button.addEventListener('click', () => dialog.showModal(), options);
  }

  // Game overlays are driven by the phase. The auxiliary dialogs use the browser's native focus handling.
  document.addEventListener(
    'keydown',
    event => {
      if (event.key !== 'Tab' || document.querySelector('dialog[open]')) return;
      const overlay = document.querySelector('.veil:not([hidden]) [role="dialog"]');
      if (!overlay) return;
      const controls = [
        ...overlay.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [tabindex="0"]'),
      ].filter(control => control.getClientRects().length > 0);
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!controls.some(control => control === active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    },
    options,
  );

  const confirmation = element<HTMLDialogElement>('confirm-expedition');
  let action: (() => void) | undefined;
  element('confirm-action').addEventListener(
    'click',
    event => {
      event.preventDefault();
      const confirmed = action;
      action = undefined;
      confirmation.close();
      confirmed?.();
    },
    options,
  );
  confirmation.addEventListener(
    'close',
    () => {
      if (!confirmation.open) action = undefined;
    },
    options,
  );
  return function confirmExpedition(title: string, label: string, next: () => void) {
    element('confirm-title').textContent = title;
    element('confirm-action').textContent = label;
    action = next;
    confirmation.showModal();
  };
}
