import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

function ConfirmDialog({ isOpen, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }) {
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onCancel(); 
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onCancel]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={onCancel}
                >   
                    <motion.div
                        className="dialog-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dialog-title"
                        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="dialog-title" className="dialog-card__title">{title}</h2>
                        <p className="dialog-card__message">{message}</p>
                        <div className="dialog-card__actions">
                            <button className="btn btn--ghost" onClick={onCancel}>{cancelLabel}</button>
                            <button className="btn btn--danger-solid" onClick={onConfirm}>{confirmLabel}</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default ConfirmDialog