/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { withAuthenticationRequired } from '@auth0/auth0-react'
import AddProductForm from './AddProductForm'
import ProductRow from './ProductRow'
import { useCurrencyRate } from './hooks/useCurrencyRate'
import { useProducts } from './hooks/useProducts'
import TableColGroup from './TableColGroup'
import { CURRENCIES, PRODUCTS_TABLE_WIDTHS, PRODUCTS_TABLE_WIDTHS_WITH_CURRENCY } from './constants'
import { usePaymentStatus } from './hooks/usePaymentStatus'
import PaymentStatusBanner from './PaymentStatusBanner'


function Products() {

    const { products, loading, error, setError, reloadProducts } = useProducts();
    const [ selectedCurrency, setSelectedCurrency ] = useState("");
    const { rate, rateLoading, rateError } = useCurrencyRate(selectedCurrency);
    const { status: paymentStatus, saleInfo, clearStatus } = usePaymentStatus(reloadProducts);

    if (loading) {
        return (
        <div className="page">
            <p className="loading-state">Loading products...</p>
        </div>
        );
    }

    if (error) {
        return (
        <div className="page">
            <p className="loading-state" style={{ color: "var(--color-red)" }}>
                Error loading products: {error}
            </p>
        </div>
        );
    }

    return (
        <div className="page">
            <h1>Products</h1>

            <PaymentStatusBanner status={paymentStatus} saleInfo={saleInfo} onDismiss={clearStatus}/>
            <div className="card">
                <div className="currency-control">
                    <label htmlFor="currency-select">View prices in: </label>
                    <select 
                        id="currency-select"
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                        <option value="">MYR (base)</option>
                        {CURRENCIES.map(code => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                    {rateLoading && (
                        <span className="currency-control__status"> 
                            <span className="currency-control__spinner"></span>
                            Fetching rate
                        </span>
                    )}
                    {rateError && (
                        <span className="currency-control__status" style={{ color: "var(--color-red)"}}>
                            {rateError}
                        </span>
                    )}
                </div>
            </div>

            <AddProductForm onProductAdded={reloadProducts} />

            <div className="card">
                {products.length === 0 ? (
                    <p>No products yet.</p>
                ) : (
                    <table className="table">
                        <TableColGroup widths=
                            {selectedCurrency ? PRODUCTS_TABLE_WIDTHS_WITH_CURRENCY : PRODUCTS_TABLE_WIDTHS} 
                        />
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Stock</th>
                                <th>Base Price (MYR)</th>
                                {selectedCurrency && <th>Price ({selectedCurrency})</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onProductChanged={reloadProducts}
                                    onError={setError}
                                    selectedCurrency={selectedCurrency}
                                    rate={rate}
                                    onSellStart={clearStatus}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>   
    );
}

export default withAuthenticationRequired(Products, {
    onRedirecting: () => <div>Loading...</div>
})