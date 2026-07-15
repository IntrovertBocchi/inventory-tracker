/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { sanitizeInteger } from './utils/sanitizeNumericInput'

function SellDialog({ isOpen, product, onConfirm, onCancel }) {
    const shouldReduceMotion = useReducedMotion();
    const [quantity, setQuantity] = useState("1");
    const [payerEmail, setPayerEmail] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e)   {
            if (e.key === "Escape") {
                handleCancel();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };   
    }, [isOpen]);
    
    function handleQuantityChange(e) {
        setQuantity(sanitizeInteger(e.target.value));
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function handleSubmit() {
        setError(null);
        const qty = Number(quantity);

        if (product && product.stock_quantity < 1) {
            setError("This product is currently out of stock.");
            return;
        }
        if (!quantity || qty < 1) {
            setError("Quantity must be at least 1.");
            return;
        }
        if (product && qty > product.stock_quantity) {
            setError(`Only ${product.stock_quantity} in stock.`);
            return;
        }
        if (!payerEmail.trim() || !isValidEmail(payerEmail.trim())) {
            setError("A valid email is required.");
            return;
        }

        setSubmitting(true);
        try {
            await onConfirm(qty, payerEmail.trim());
            } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    function handleCancel() {
        setQuantity("1");
        setPayerEmail("");
        setError(null);
        setSubmitting(false);
        onCancel();
    }

    if (!product) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <motion.div
                        className="dialog-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sell-dialog-title"
                        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="sell-dialog-title" className="dialog-card__title">Sell {product.name}</h2>
                        <p className="dialog-card__message">
                            {product.stock_quantity} in stock at RM{product.base_price.toFixed(2)} each.
                        </p>

                        <div className = "field-group">
                            <input
                                name="quantity"
                                placeholder="Quantity"
                                value={quantity}
                                onChange={handleQuantityChange}
                                maxLength={7}
                                inputMode="numeric"
                            />
                            <input
                                name="payer_email"
                                type="email"
                                placeholder="Customer email"
                                value={payerEmail}
                                onChange={(e) => setPayerEmail(e.target.value)}
                            />
                        </div>

                        {error && <p style={{ color: "var(--color-red" }}>{error}</p>}

                        <div className="dialog-card__actions">
                            <button className="btn btn--ghost" onClick={handleCancel}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Redirecting..." : "Proceed to Payment"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default SellDialog