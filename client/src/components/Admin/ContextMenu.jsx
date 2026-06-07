import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContextMenu = ({ x, y, isOpen, onClose, actions }) => {
  useEffect(() => {
    const handleClickOutside = () => isOpen && onClose();
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Make sure it doesn't overflow screen bounds
  const adjustedX = x + 200 > window.innerWidth ? window.innerWidth - 220 : x;
  const adjustedY = y + (actions.length * 40) > window.innerHeight ? window.innerHeight - (actions.length * 40) - 20 : y;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, transformOrigin: 'top left' }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            top: adjustedY,
            left: adjustedX,
            width: '200px',
            background: 'rgba(20, 20, 25, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            padding: '8px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {actions.map((action, idx) => {
            if (action.type === 'divider') {
              return <div key={`div-${idx}`} style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />;
            }
            return (
              <div
                key={action.label}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="context-menu-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                  color: action.danger ? '#ef4444' : 'var(--text-secondary)',
                  transition: 'all 0.1s ease',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = action.danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = action.danger ? '#ef4444' : 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = action.danger ? '#ef4444' : 'var(--text-secondary)';
                }}
              >
                {action.icon && <span style={{ display: 'flex', alignItems: 'center', width: '16px' }}>{action.icon}</span>}
                {action.label}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;
