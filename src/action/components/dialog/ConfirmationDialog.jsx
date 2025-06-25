import React from 'react';
import styles from './ConfirmationDialog.module.css';

export const ConfirmationDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>
        
        <div className={styles.content}>
          {message && <p className={styles.message}>{message}</p>}
          {children}
        </div>
        
        <div className={styles.actions}>
          <button 
            className={`${styles.button} ${styles.cancelButton}`} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.button} ${styles.confirmButton}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};