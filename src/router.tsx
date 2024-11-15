import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { RankingPage } from './pages'

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <RankingPage
              pageName="musics"
              pageDescription="Aqui os fãs de Hebert Freire têm o poder de escolher as próximas músicas do canal!"
            />
          }
        />
        <Route
          path="/louvores"
          element={
            <RankingPage
              pageName="praises"
              pageDescription="Aqui os fãs de Hebert Freire têm o poder de escolher os próximos louvores do curso!"
            />
          }
        />
      </Routes>
    </Router>
  )
}
