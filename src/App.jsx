import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Trends from './pages/Trends'

function NotFound() {
  return <div>404 - Page Not Found</div>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/trends" element={<Trends />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
