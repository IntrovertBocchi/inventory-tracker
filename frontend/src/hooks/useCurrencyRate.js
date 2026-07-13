/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../api';

/**
 * Fetches a live currency conversion rate whenever `selectedCurrency`
 * changes. Handles three things a naive fetch wouldn't:
 * 
 * 1. Clears the old rate immediately when switching currencies, so the
 *    UI never shows a stale number next to the newly selected currency's
 *    label while the new rate is still loading.
 * 2. Cancels any in-flight request if the user picks another currency 
 *    before the first one finishes - without this, a slow arriving response
 *    could overwrite a faster, more recent one, and show the wrong rate (a "race condition").
 * 3. Ignores errors caused by our own cancellation, so switching
 *    currencies quickly doesn't flash a false error message.
 */
export function useCurrencyRate(selectedCurrency) {
    const { getAccessTokenSilently } = useAuth0();
    const [ rate, setRate ] = useState(null);
    const [ rateError, setRateError ] = useState(null);
    const [ rateLoading, setRateLoading ] = useState(false);

    useEffect(() => {
        if (!selectedCurrency) {
            setRate(null);
            return;
        }

        const controller = new AbortController();

        async function loadRate() {
            setRateLoading(true);
            setRateError(null);
            setRate(null);
            try {
                const token = await getAccessTokenSilently();
                const data = await apiFetch(`/convert?to=${selectedCurrency}`, token, {
                    signal: controller.signal
                });
                setRate(data.rate);
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }
                setRateError(err.message);
                setRate(null);
            } finally {
                if (!controller.signal.aborted) {
                    setRateLoading(false);
                }
            }
        }

        loadRate();    

        return () => {
            controller.abort();
        };
    }, [selectedCurrency, getAccessTokenSilently]);

    return { rate, rateLoading, rateError };
}