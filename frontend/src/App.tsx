import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import { Dashboard } from './components/Dashboard'
import { Layout } from './components/Layout'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StocksPage } from './pages/StocksPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="stocks" element={<StocksPage />} />
          <Route path="stocks/dashboard" element={<Dashboard />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
