import React, { useEffect, useRef } from "react";
import styles from "./ConfirmationDialog.module.css";
import { createPortal } from "react-dom";

export const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
}) => {
  const dialogRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  // Focus management: trap focus inside dialog
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement;
      // Focus the first button in the dialog
      const focusableEls = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableEls.length) {
        focusableEls[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onCancel();
        }
        // Trap focus
        if (e.key === "Tab") {
          const focusable = Array.from(focusableEls);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Restore focus to previously focused element
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className={styles.header}>
          <h3 id="dialog-title">{title}</h3>
        </div>
        <div className={styles.content}>
          {message && (
            <p id="dialog-message" className={styles.message}>
              {message}
            </p>
          )}
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
    </div>,
    document.getElementById("confirmBox"),
  );
};
