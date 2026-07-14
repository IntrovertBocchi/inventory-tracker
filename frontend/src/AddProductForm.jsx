import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from './api';
import { MAX_BASE_PRICE, MAX_NAME_LENGTH, MAX_SKU_LENGTH, MAX_STOCK_QUANTITY } from './constants';
import { formatPrice } from './utils/formatPrice'
import { sanitizeInteger, sanitizeDecimal } from './utils/sanitizeNumericInput';

function AddProductForm({onProductAdded}) {
    const { getAccessTokenSilently } = useAuth0();

    // Product forms setting
    const [ formData, setFormData ] = useState({
        name: "",
        sku: "",
        stock_quantity: "",
        base_price: ""
    });

    // Forms error
    const [ formError, setFormError ] = useState(null);
    const [ submitting, setSubmitting ] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        let sanitized = value;

        if (name === "stock_quantity") {
            sanitized = sanitizeInteger(value);
        } else if (name === "base_price") {
            sanitized = sanitizeDecimal(value);
        }
        setFormData(prev => ({ ...prev, [name]: sanitized }));
    }
    
    function handlePriceBlur() {
    setFormData(prev => ({ ...prev, base_price: formatPrice(prev.base_price) }));
    }

    function validateForm() {
        if (!formData.name.trim()) {
            return "Name is required.";
        }
        if (formData.name.trim().length > MAX_NAME_LENGTH) {
            return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
        }
        if (!formData.sku.trim()) {
            return "SKU is required.";
        }
        if (formData.sku.trim().length > MAX_SKU_LENGTH) {
            return `SKU must be ${MAX_SKU_LENGTH} characters or fewer.`;
        }
        const stock = Number(formData.stock_quantity);
        if (!formData.stock_quantity === "" || !Number.isInteger(stock) || stock < 0) {
            return "Stock quantity must be a non-negative whole number.";
        }
        if (stock > MAX_STOCK_QUANTITY) {
            return `Stock quantity must be ${MAX_STOCK_QUANTITY} or fewer.`;
        }

        const price = Number(formData.base_price);
        if (!formData.base_price === "" || isNaN(price) || price < 0) {
            return "Base price must be a non-negative number.";
        }
        if (price > MAX_BASE_PRICE) {
            return `Base price must be ${MAX_BASE_PRICE} or less.`;
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError(null);

        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            const token = await getAccessTokenSilently();
            await apiFetch("/products", token, {
                method: "POST",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    sku: formData.sku.trim(),
                    stock_quantity: Number(formData.stock_quantity),
                    base_price: Number(formData.base_price)
                })
            });

            setFormData({ name: "", sku: "", stock_quantity: "", base_price: ""})
            await onProductAdded();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }
    return (
    <div className="card">
        <h2 className="section-title">Add Product</h2>
            <div className="field-group">
                <input
                    name="name" placeholder="Name" value={formData.name} onChange={handleChange} maxLength={MAX_NAME_LENGTH}
                />
                <input
                    name="sku" placeholder="sku" value={formData.sku} onChange={handleChange} maxLength={MAX_SKU_LENGTH}
                />
                <input
                    name="stock_quantity" placeholder="Stock Quantity" value={formData.stock_quantity} onChange={handleChange} maxLength={7}
                />
                <input
                    name="base_price" placeholder="Base Price (MYR)" value={formData.base_price} onChange={handleChange} onBlur={handlePriceBlur} maxLength={10}
                />
            </div>

            {formError && <p style={{color: "var(--color-red)"}} >{formError}</p>}
            <button className= "btn btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Adding..." : "Add Product"}
            </button>
        </div>
    );   
}

export default AddProductForm