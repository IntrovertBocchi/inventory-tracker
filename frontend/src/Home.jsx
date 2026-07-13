import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth0 } from '@auth0/auth0-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}
function Home() {
  const {isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const shouldReduceMotion = useReducedMotion()
  
  if (isLoading) {
    return (
      <div className="page">
       <p className="loading-state">Loading...</p> 
      </div>
    )
  }
  
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16},
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  const stamp = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 1.35},
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut'}
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="hero">
        <motion.div className="hero__content" variants={container} initial="hidden" animate="show">
          <motion.p className="hero__eyebrow" variants={item}>
            Small Business Inventory Tracker
          </motion.p>
          <motion.h1 className="hero__title" variants={item}>
            Know what's on the shelf, <br />before it's gone.
          </motion.h1>
          <motion.p className="hero__subtitle" variants={item}>
            Track stock, prices, and value across currencies — all in one ledger.
          </motion.p>
          <motion.div className="hero__cta" variants={stamp}>
            <button className="btn btn--primary btn--lg" onClick={() => loginWithRedirect()}>
              Log In
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const displayName = user.name || user.email

  return (
    <div className="page">
      <motion.div className="welcome" variants={container} initial="hidden" animate="show">
        <motion.p className="welcome__date" variants={item}>
           {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </motion.p>
        <motion.h1 className="welcome__greeting" variants={item}>
          {getGreeting()}, {displayName}
        </motion.h1>
        <motion.p className="welcome__subtitle" variants={item}>
          Here's where you left off.
        </motion.p>

        <motion.div className="quick-links" variants={item}>
          <Link to="/dashboard" className="quick-link">
            <span className="quick-link__label">Dashboard</span>
            <span className="quick-link__desc">Stock levels, alerts, and total value</span>
          </Link>
           <Link to="/products" className="quick-link">
            <span className="quick-link__label">Products</span>
            <span className="quick-link__desc">Add, edit, and manage inventory</span>
           </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Home
