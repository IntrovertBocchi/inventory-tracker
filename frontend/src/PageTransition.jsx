import { motion, useReducedMotion } from 'framer-motion'

/**
 * Wraps a page in a slide/fade transition when navigating between routes.
 * Respects the user's OS level "reduce motion" accessibility setting -
 * if enabled, the slide distance collapses to zero and only a plain fade
 * plays, since some people find horizontal motion uncomfortable or
 * disorienting (e.g vestibular disorder)
 */
function PageTransition({ children }) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -24 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
            {children}
        </motion.div>
    );
}

export default PageTransition