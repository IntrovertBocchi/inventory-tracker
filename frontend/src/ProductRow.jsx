import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from './api';
import { MAX_BASE_PRICE, MAX_NAME_LENGTH, MAX_SKU_LENGTH, MAX_STOCK_QUANTITY } from './constants';
import { formatPrice } from './utils/formatPrice'
import { formatCurrency } from './utils/formatCurrency';
import { sanitizeInteger, sanitizeDecimal } from './utils/sanitizeNumericInput';
import ConfirmDialog from './ConfirmDialog';
import SellDialog from './SellDialog';


function ProductRow({ product, onProductChanged, onError, selectedCurrency, rate, onSellStart }) {
    const { getAccessTokenSilently } = useAuth0();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [editError, setEditError] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen ] = useState(false);

    const [isSellOpen, setIsSellOpen ] = useState(false);
    
    // Edit product functionality
    function startEdit(product) {
        setIsEditing(true);
        setEditData({
            name: product.name,
            sku: product.sku,
            stock_quantity: String(product.stock_quantity),
            base_price: String(product.base_price)
        });
        setEditError(null);
    }

    function cancelEdit() {
        setIsEditing(false);
        setEditData({});
        setEditError(null);
    }

    function handleEditChange(e) {
        const { name, value } = e.target;
        let sanitized = value;

        if (name === "stock_quantity") {
            sanitized = sanitizeInteger(value);
        } else if (name === "base_price") {
            sanitized = sanitizeDecimal(value);
        }

        setEditData(prev => ({ ...prev, [name]: sanitized }));
    }

    function handleEditPriceBlur() {
    setEditData(prev => ({ ...prev, base_price: formatPrice(prev.base_price) }));
    }

    function validateEditData() {
        if (!editData.name.trim()) {
            return "Name is required.";
        }
        if (editData.name.trim().length > MAX_NAME_LENGTH) {
            return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
        }
        if (!editData.sku.trim()) {
            return "SKU is required.";
        }
        if (editData.sku.trim().length > MAX_SKU_LENGTH) {
            return `SKU must be ${MAX_SKU_LENGTH} characters or fewer.`;
        }
        const stock = Number(editData.stock_quantity);
        if (editData.stock_quantity === "" || !Number.isInteger(stock) || stock < 0) {
            return "Stock quantity must be a non-negative whole number."
        }
        if (stock > MAX_STOCK_QUANTITY) {
            return `Stock quantity must be ${MAX_STOCK_QUANTITY} or fewer.`;
        }
        const price = Number(editData.base_price);
        if (editData.base_price === "" || isNaN(price) || price < 0) {
            return "Base price must be a non-negative number."
        }
        if (price > MAX_BASE_PRICE) {
            return `Base price must be ${MAX_BASE_PRICE} or less.`;
        }
    }

    async function saveEdit(productId) {
        const validationError = validateEditData();
        if (validationError) {
            setEditError(validationError);
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            await apiFetch(`/products/${productId}`, token, {
                method: "PUT",
                body: JSON.stringify({
                    name: editData.name.trim(),
                    sku: editData.sku.trim(),
                    stock_quantity: Number(editData.stock_quantity),
                    base_price: Number(editData.base_price)
                })
            });
            
            setIsEditing(false);
            setEditData({});
            await onProductChanged();
        } catch (err) {
            setEditError(err.message);
        }
    }

    // Delete product functionality
    function handleDeleteClick() {
        setIsDeleteOpen(true);
    }

    async function confirmDelete() {
        setIsDeleteOpen(false);

        try {
            const token = await getAccessTokenSilently();
            await apiFetch(`/products/${product.id}`, token, {
                method: "DELETE"
            });
            await onProductChanged();
        } catch (err) {
            onError(err.message);
        }
    }

    async function handleSellConfirm(quantity, payerEmail) {
        const token = await getAccessTokenSilently();
        const result = await apiFetch(`/products/${product.id}/sell`, token, {
            method: "POST",
            body: JSON.stringify({ quantity, payer_email: payerEmail})
        });
        window.location.href = result.checkout_url;
    }

    if (isEditing) {
        return (
            <tr>
                <td>
                    <input name="name" value={editData.name} onChange={handleEditChange} maxLength={MAX_NAME_LENGTH}/>
                </td>
                <td>
                    <input name="sku" value={editData.sku} onChange={handleEditChange} maxLength={MAX_SKU_LENGTH}/>
                </td>
                <td>
                    <input name="stock_quantity" value={editData.stock_quantity} onChange={handleEditChange} maxLength={7} inputMode="numeric"/>
                </td>
                <td>
                    <input name="base_price" value={editData.base_price} onChange={handleEditChange} onBlur={handleEditPriceBlur} maxLength={10} inputMode="decimal"/>
                </td>
                {selectedCurrency && <td className="numeric"></td>}
                <td>
                    <div className="row-actions">
                        <button className="btn btn--primary" onClick={() => saveEdit(product.id)}>Save</button>
                        <button className="btn btn--ghost" onClick={cancelEdit}>Cancel</button>
                    </div>
                    {editError && <p style={{ color: "var(--color-red)"}}>{editError}</p>}
                </td>
            </tr>
        );
    }

    return (
        <>
            <tr>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td className="numeric">{product.stock_quantity}</td>
                <td className="numeric">{formatCurrency(product.base_price)}</td>
                { selectedCurrency && (
                    <td className="numeric">
                        {rate !== null ? formatCurrency(product.base_price * rate) : "—"}
                    </td>
                )}
                <td>
                    <div className="row-actions">
                        <button classNmae="btn btn--primary" onClick={() => { onSellStart(); setIsSellOpen(true); }} disabled={product.stock_quantity === 0}>Sell</button>
                        <button className="btn btn--ghost" onClick={() => startEdit(product)}>Edit</button>
                        <button className="btn btn--danger" onClick={handleDeleteClick}>Delete</button>
                    </div>
                </td>
            </tr>
            <ConfirmDialog
                isOpen={isDeleteOpen}
                title="Delete this product?"
                message={`This will permanently remove "${product.name}" from your inventory. This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteOpen(false)}
            />
            <SellDialog
                isOpen={isSellOpen}
                product={product}
                onConfirm={handleSellConfirm}
                onCancel={() => setIsSellOpen(false)}
            />
        </>
    );
}

export default ProductRow