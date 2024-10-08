import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Music } from '../Music'
import { toast } from 'react-toastify'
import Logo from '../assets/logo.png'
import { api } from '../libs/axios'
import { v4 as uuid4 } from 'uuid'

export type MusicData = {
  id: string
  name: string
  singer?: string
  votes: number
  visible: boolean
}

type Vote = {
  musicId: string
}

export function ChannelRankingPage() {
  const [musics, setMusics] = useState<MusicData[]>([])
  const [filteredMusics, setFilteredMusics] = useState<MusicData[]>([])
  const [musicToSearch, setMusicToSearch] = useState('')
  const [singerToSearch, setSingerToSearch] = useState('')

  async function fetchAllMusics() {
    const { data }: { data: MusicData[] } = await api.get('/api/musics')
    const musicDataWithVisible = data.map(music => ({
      ...music,
      visible: true
    }))
    setMusics(musicDataWithVisible)
  }

  useEffect(() => {
    fetchAllMusics()
  }, [])

  useEffect(() => {
    if (musics) {
      handleSearch()
    }
  }, [musics])

  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .split('')
      .filter(char => char.match(/[\p{L}\p{N}]/u))
      .join('')
      .toLowerCase()
  }

  async function handleSearch() {
    if (!musicToSearch || !singerToSearch) {
      setFilteredMusics([])
      return
    }

    const normalizedMusicToSearch = normalizeText(musicToSearch)
    const normalizedSingerToSearch = normalizeText(singerToSearch)

    const musicsFound = musics.map(music => {
      const normalizedMusicName = normalizeText(music.name)
      const normalizedMusicSinger = normalizeText(music.singer || '')

      if (
        normalizedMusicName.includes(normalizedMusicToSearch) &&
        normalizedMusicSinger.includes(normalizedSingerToSearch)
      ) {
        return { ...music, visible: true }
      }

      return { ...music, visible: false }
    })

    const foundSomeMusic = musicsFound.some(music => music.visible === true)

    if (!foundSomeMusic) {
      musicsFound.push({
        id: uuid4(),
        name: musicToSearch,
        singer: singerToSearch,
        votes: 0,
        visible: true
      })
    }

    setFilteredMusics(musicsFound)
  }

  function handleCleanSearch() {
    setMusicToSearch('')
    setSingerToSearch('')
    setFilteredMusics([])
  }

  async function handleVote(musicId: string, newMusic: MusicData | undefined = undefined) {
    const userVoteData = localStorage.getItem('ranking-musicas-hebert-v1@userVoteData')
    let voteData: Vote[] = []

    if (userVoteData) {
      voteData = JSON.parse(userVoteData)

      if (voteData.length >= 3) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Você atingiu o limite de 3 votos!',
          confirmButtonColor: '#c202ff',
          background: '#121212',
          color: '#fff'
        })
        return
      }

      if (voteData.some(vote => vote.musicId === musicId)) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Você já votou nessa música! Apenas um voto por música é permitido.',
          confirmButtonColor: '#c202ff',
          background: '#121212',
          color: '#fff'
        })
        return
      }
    }

    const vote = {
      musicId: musicId
    }

    voteData.push(vote)

    localStorage.setItem('ranking-musicas-hebert-v1@userVoteData', JSON.stringify(voteData))
    let updatedMusics: MusicData[]

    if (newMusic) {
      newMusic.votes = 1
      updatedMusics = [...musics, newMusic]
      await api.post('/api/musics', newMusic)
    } else {
      updatedMusics = await Promise.all(
        musics.map(async oldMusic => {
          const updatedMusic = { ...oldMusic }

          if (musicId === oldMusic.id) {
            updatedMusic.votes += 1
            await api.put(`/api/musics/${updatedMusic.id}`, updatedMusic)
          }

          return updatedMusic
        })
      )
    }

    updatedMusics.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes
      }

      return a.name.localeCompare(b.name)
    })

    setMusics(updatedMusics)

    toast.success('Seu voto foi computado com sucesso!')
  }

  return (
    <div>
      <header>
        <img src={Logo} alt="" />
      </header>
      <main>
        <h1>Aqui os fãs de Hebert Freire têm o poder de escolher as próximas músicas do canal!</h1>

        <div className="musicsContainer">
          <div className="formContainer">
            <input
              type="text"
              placeholder="Informe o nome da música"
              value={musicToSearch}
              onChange={e => setMusicToSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Informe o nome do artista"
              value={singerToSearch}
              onChange={e => setSingerToSearch(e.target.value)}
            />
            <div className="buttonsGroup">
              <button className="searchButton" type="button" onClick={handleSearch}>
                Pesquisar
              </button>
              <button className="cleanSearchButton" type="button" onClick={handleCleanSearch}>
                Limpar pesquisa
              </button>
            </div>
          </div>

          <div className="tableContainer">
            <table border={1}>
              <thead>
                <tr>
                  <th />
                  <th>Música</th>
                  <th>Votos</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredMusics.length > 0
                  ? filteredMusics.map((music, index) => {
                      if (music.visible) {
                        return <Music key={music.id} music={music} index={index} handleVote={handleVote} />
                      }
                    })
                  : musics.map((music, index) => {
                      return <Music key={music.id} music={music} index={index} handleVote={handleVote} />
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer>
        <span>Desenvolvido com ❤ por Raphael Gibson</span>
        <span>Contato: raphaelgibson1998@gmail.com</span>
      </footer>
    </div>
  )
}
