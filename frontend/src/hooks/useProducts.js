/* eslint-disable react-hooks/set-state-in-effect */
// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api';

export function useProducts() {
    const { getAccessTokenSilently } = useAuth0();
    const [ products, setProducts ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError] = useState(null);

    const loadProducts = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const data = await apiFetch("/products", token);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    return { products, loading, error, setError, reloadProducts: loadProducts };
}