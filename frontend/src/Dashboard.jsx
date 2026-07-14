/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react'
import { useCurrencyRate } from './hooks/useCurrencyRate'
import { useProducts } from './hooks/useProducts';
import TableColGroup from './TableColGroup'
import { CURRENCIES, DASHBOARD_TABLE_WIDTHS, LOW_STOCK_THRESHOLD } from './constants'
import { formatCurrency } from './utils/formatCurrency';

function Dashboard() {

    const { products, loading, error } = useProducts();
    const [ selectedCurrency, setSelectedCurrency ] = useState("");
    const { rate, rateLoading, rateError } = useCurrencyRate(selectedCurrency);
    
    if (loading) {
        return (
            <div className="page">
            <p className="loading-state">Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
            <p className="loading-state" style={{ color: "var(--color-red)" }}>
                Error loading dashboard: {error}
            </p>
            </div>
        );
    }

    const lowStockProducts = products.filter( p => p.stock_quantity < LOW_STOCK_THRESHOLD);
    const totalProducts = products.length;

    const totalValueMYR = products.reduce(
        (sum, p) => sum + (p.base_price * p.stock_quantity),
        0
    );

    const displayCurrency = selectedCurrency || "MYR";
    const totalValueDisplay = selectedCurrency && rate !== null
        ? totalValueMYR * rate
        : totalValueMYR;

    return (
        <div className="page">
                <h1>Inventory Dashboard</h1>

                <div className="card">
                    <div className="currency-control">
                        <label htmlFor='currency-select'>Display currency: </label>
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
                                Fetching rate...
                            </span>
                            )}
                        {rateError && (
                            <span className="currency-control__status" style={{ color: "var(--color-red)"}}> 
                                {rateError}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="stat-grid">
                    <div className="stat-card">
                        <p className="stat-card__label"> Total Inventory Value:</p>
                        <p className="stat-card__value">
                            {selectedCurrency && rate === null
                            ? "—"
                            : `${formatCurrency(totalValueDisplay)} ${displayCurrency}`}
                        </p>
                    </div>
                
                    <div className="stat-card">
                        <p className="stat-card__label">Total Products</p>
                        <p className="stat-card__value">{totalProducts}</p>
                    </div>

                    <div className={`stat-card ${lowStockProducts.length > 0 ? 'stat-card--warning' : ''}`}>
                        <p className="stat-card__label">Low Stock Items</p>
                        <p className="stat-card__value">{lowStockProducts.length}</p>
                    </div>
                </div>
                
                <div className={lowStockProducts.length === 0 ? 'alert-card alert-card__empty' : 'alert-card'}>
                    <h2 className="section-title">
                        {lowStockProducts.length === 0
                            ? "All products are sufficiently stocked"
                            : `Low Stock Alerts (below ${LOW_STOCK_THRESHOLD} units)`}
                    </h2>
                    {lowStockProducts.length === 0 ? (
                        <p>No products are low on stock.</p>
                    ) : (
                        <ul className="alert-list">
                            {lowStockProducts.map(p => (
                                <li key={p.id}>
                                    <span className="alert-item__name">
                                        {p.name} 
                                        <span className="alert-item__sku">{p.sku}</span>
                                    </span>
                                    <span className="alert-item__count">{p.stock_quantity} left</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div className="card">
                    <h2 className="section-title">All products</h2>
                    <table className="table">
                    <TableColGroup widths={DASHBOARD_TABLE_WIDTHS} />
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SKU</th>
                            <th>Stock</th>
                            <th>Base Price (MYR)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={p.stock_quantity < LOW_STOCK_THRESHOLD ? { color: "red"} : {}}>
                                <td>{p.name}</td>
                                <td>{p.sku}</td>
                                <td className="numeric">{p.stock_quantity}</td>
                                <td className="numeric">{formatCurrency(p.base_price)}</td>
                                <td>
                                <span className={`badge ${p.stock_quantity < LOW_STOCK_THRESHOLD ? 'badge--low' : 'badge--ok'}`}>
                                    {p.stock_quantity < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                                    </span> 
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default withAuthenticationRequired(Dashboard, {
    onRedirecting: () => <div>Loading...</div>
})