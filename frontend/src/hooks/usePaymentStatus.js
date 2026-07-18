/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api';

/**
 * Reads a `?payment=success|cancelled` query param left by a payment
 * provider's redirect, runs a callback once (e.g. to refresh data), then
 * cleans the query string so the status doesn't persist across refreshes
 * or reappear if the user navigates back.
 * 
 * The status is captured into its own local state on mount, separate
 * from the URL itself - otherwise clearing the query string would erase
 * the value before the banner ever had a chance to render
 */
export function usePaymentStatus(onPaymentComplete) {
    const { getAccessTokenSilently } = useAuth0();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState(null);
    const [saleInfo, setSaleInfo] = useState(null);

    useEffect(() => {
        const paymentParam = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");
        const billplzId = searchParams.get("billplz[id]");

        if (paymentParam) {
            setStatus(paymentParam);
            if (paymentParam === "success") {
                onPaymentComplete();
            }
            setSearchParams({}, { replace: true });

            if (sessionId) {
                getAccessTokenSilently()
                    .then(token => apiFetch(`/sales/${sessionId}`, token))
                    .then(data => setSaleInfo(data))
                    .catch(() => setSaleInfo(null));
            }
        } else if (billplzId) {
            
            setSearchParams({}, { replace: true });
            const checkSaleStatus = async () => {
                try {
                    const token = await getAccessTokenSilently();
                    const data = await apiFetch(`/sales/${billplzId}`, token);

                    setSaleInfo(data);

                    if (data.status === "paid") {
                        setStatus("success");
                        onPaymentComplete();
                    } else if (data.status === "failed" || data.status === "cancelled") {
                        setStatus("cancelled");
                    } else {
                        setTimeout(checkSaleStatus, 1500);
                    }
                } catch {
                    setStatus(null);
                }
            };

            checkSaleStatus();
        }
    }, []);

    function clearStatus() {
        setStatus(null);
        setSaleInfo(null);
    }

    return {status, saleInfo, clearStatus };
}
