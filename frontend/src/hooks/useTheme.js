import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'inventory-tracker-theme'

// Rapid, repeated light/dark flips are a real accessibility hazard for
// people with photosensitive epilepsy (large-area, high-contrast flashing
// can trigger seizures). This cooldown makes it physically impossible to
// switch themes more than roughly twice per second, no matter how fast
// someone clicks the toggle.
const TOGGLE_COOLDOWN_MS = 500

function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
        return stored
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme)
    const [isOnCooldown, setIsOnCooldown] = useState(false)
    const lastToggleRef = useRef(0)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    function toggleTheme() {

        const now = Date.now()
        if (now - lastToggleRef.current < TOGGLE_COOLDOWN_MS) {
        return
        }

        lastToggleRef.current = now
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
        setIsOnCooldown(true)
        setTimeout(() => setIsOnCooldown(false), TOGGLE_COOLDOWN_MS)
    }

    return { theme, toggleTheme, isOnCooldown }
}