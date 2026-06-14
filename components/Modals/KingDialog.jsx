"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Check } from '../Common/Icons';

/**
 * KingDialog - A highly professional, animated, and glassmorphic dialog component.
 * 
 * @param {boolean} isOpen - Whether the dialog is visible.
 * @param {function} onClose - Function to call when closing the dialog.
 * @param {string} title - Title of the dialog.
 * @param {ReactNode} children - Content of the dialog.
 * @param {ReactNode} footer - Optional footer actions/content.
 * @param {string} maxWidth - Optional max-width for the dialog (default: '500px').
 */
const KingDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  maxWidth = '500px' 
}) => {
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
            className="glass-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal"
              style={{
                width: '100%',
                maxWidth: maxWidth,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Accent Line */}
              <div style={{
                height: '4px',
                width: '100%',
                background: 'var(--accent-gradient)',
              }} />

              {/* Header */}
              <div style={{
                padding: '24px 32px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'white',
                  margin: 0,
                }}>
                  {title}
                </h3>
                <motion.button
                  whileHover={{ rotate: 90, background: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Body */}
              <div style={{
                padding: '0 32px 32px',
                color: 'var(--text-dim)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div style={{
                  padding: '20px 32px',
                  background: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}>
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KingDialog;
