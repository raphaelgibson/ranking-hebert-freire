import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import HebertFreire from '../../assets/hebert-freire.png'
import { Header } from '../../components'
import { api } from '../../libs/axios'
import './styles.scss'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem('rankings-hebert-v1@userData')

    if (userData) {
      navigate('/')
    }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const {
        data: { accessToken }
      } = await api.post<{ accessToken: string }>('/api/login', { email, password })

      localStorage.setItem('rankings-hebert-v1@userData', JSON.stringify({ accessToken }))
      navigate('/')
    } catch (error) {
      const errorData = error as { message: string; status?: number }

      if (errorData.status === 401) {
        toast.error('E-mail e/ou senha incorretos.')
      } else {
        console.error(errorData.message)
        toast.error(errorData.message || 'Ocorreu um erro inesperado durante o login.')
      }
    }
  }

  return (
    <div>
      <Header />
      <main>
        <div className="hebertFreire">
          <img src={HebertFreire} alt="" width={300} />
        </div>

        <form className="formContainer" onSubmit={handleLogin}>
          <div className="formGroup">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              autoComplete="off"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="signInButton" type="submit">
            Entrar
          </button>
        </form>
      </main>
    </div>
  )
}
