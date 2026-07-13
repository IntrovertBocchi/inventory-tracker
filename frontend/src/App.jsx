import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './Home'
import Dashboard from './Dashboard' 
import Products from './Products'
import Nav from './Nav'
import PageTransition from './PageTransition'
import { AnimatePresence } from 'framer-motion'

function App() {
  const location = useLocation();

  return (
    <>
      <Nav />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
