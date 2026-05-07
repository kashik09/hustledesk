import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Trends from './pages/Trends'

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-stone-800">404</h1>
      <p className="text-stone-500 mt-2">Page not found</p>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
