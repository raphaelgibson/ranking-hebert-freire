import './App.scss'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AppRouter } from './router'

export function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer theme="dark" autoClose={4000} />
    </>
  )
}
