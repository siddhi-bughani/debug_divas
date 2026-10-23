import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  explanation = '',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full shrink-0 ${
              isDestructive
                ? 'bg-sahay-terracotta-light text-sahay-terracotta'
                : 'bg-sahay-ochre-light text-sahay-ochre'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-sahay-charcoal leading-relaxed">{message}</p>
            {explanation && (
              <p className="mt-2 text-xs text-sahay-slate bg-sahay-ivory p-2.5 rounded border border-sahay-border">
                {explanation}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-sahay-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-sahay-border text-xs font-medium text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-border-light transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded text-xs font-medium text-white transition-colors ${
              isDestructive
                ? 'bg-sahay-terracotta hover:bg-sahay-terracotta/90'
                : 'bg-sahay-forest-action hover:bg-sahay-forest-hover'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
