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

    async function pollSaleStatus(referenceId) {
        try {
            const token = await getAccessTokenSilently();
            const data = await apiFetch(`/sales/${referenceId}`, token);

            setSaleInfo(data);

            if (data.status === "paid") {
                setStatus("success");
                onPaymentComplete();
            } else if (data.status === "failed" || data.status === "cancelled") {
                setStatus("cancelled");
            } else {
                setTimeout(() => pollSaleStatus(referenceId), 1500);
            }
        } catch {
            setStatus(null);
        }
    }
    useEffect(() => {
        const paymentParam = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");
        const billplzId = searchParams.get("billplz[id]");
        const hitpayReference = searchParams.get("reference");

        const referenceId = sessionId || billplzId || hitpayReference;

        if (paymentParam && referenceId) {
            setStatus(paymentParam === "success" ? "pending" : "cancelled");
            setSearchParams({}, { replace: true });

            if (paymentParam === "success") {
                pollSaleStatus(referenceId);
            }
            
        } else if (billplzId || hitpayReference) {
            setSearchParams({}, { replace: true });
            pollSaleStatus(referenceId);
        }
    }, []);

    function clearStatus() {
        setStatus(null);
        setSaleInfo(null);
    }

    return {status, saleInfo, clearStatus };
}
