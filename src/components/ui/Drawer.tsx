import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
  footer,
}: DrawerProps) {
  // Prevent scrolling when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] max-h-[92vh] flex flex-col md:hidden shadow-2xl",
              className
            )}
          >
            {/* Background extension for mobile safe areas/gaps */}
            <div className="absolute top-full left-0 right-0 h-screen bg-zinc-900" />

            {/* Handle */}
            <div className="flex justify-center p-4 shrink-0">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4 shrink-0">
                {title && <h2 className="text-xl font-bold text-zinc-100">{title}</h2>}
                {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 pb-[env(safe-area-inset-bottom,24px)] pt-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
                {footer}
              </div>
            )}
            {!footer && <div className="h-[env(safe-area-inset-bottom,24px)] shrink-0" />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
