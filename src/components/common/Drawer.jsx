import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-sahay-charcoal/40 backdrop-blur-xs"
          />

          {/* Drawer slide-in from right */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`w-screen ${width} bg-white shadow-modal flex flex-col border-l border-sahay-border`}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-sahay-border flex items-start justify-between bg-sahay-ivory/60">
                <div>
                  <h3 className="text-lg font-semibold text-sahay-forest-deep">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-sahay-slate mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded text-sahay-slate hover:text-sahay-charcoal hover:bg-sahay-border/50 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
