import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { ChannelRankingPage, PraisesRankingPage } from './pages'

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChannelRankingPage />} />
        <Route path="/louvores" element={<PraisesRankingPage />} />
      </Routes>
    </Router>
  )
}
