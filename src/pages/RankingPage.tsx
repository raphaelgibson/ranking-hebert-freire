import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { Music, type MusicData, type Vote } from '../Music'
import Logo from '../assets/logo.png'
import { api } from '../libs/axios'

type RankingPageProps = {
  pageName: string
  pageDescription: string
}

export function RankingPage({ pageName, pageDescription }: RankingPageProps) {
  const [musics, setMusics] = useState<MusicData[]>([])
  const [filteredMusics, setFilteredMusics] = useState<MusicData[]>([])
  const [musicToSearch, setMusicToSearch] = useState('')
  const [singerToSearch, setSingerToSearch] = useState('')

  async function fetchAllMusics() {
    const { data }: { data: MusicData[] } = await api.get(`/api/${pageName}`)
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

  async function handleVote(musicId: string | undefined = undefined, newMusic: MusicData | undefined = undefined) {
    const userVoteData = localStorage.getItem(`ranking-${pageName}-hebert-v1@userVoteData`)
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

    let updatedMusics: MusicData[]

    if (newMusic) {
      try {
        const { data } = await api.post<{ id: string; votes: number }>(`/api/${pageName}`, newMusic)
        voteData.push({ musicId: data.id })
        newMusic.id = data.id
        newMusic.votes = data.votes
        updatedMusics = [...musics, newMusic]
      } catch (error) {
        console.error(error)
        throw error
      }
    } else {
      updatedMusics = await Promise.all(
        musics.map(async oldMusic => {
          const updatedMusic = { ...oldMusic }

          if (musicId && musicId === oldMusic.id) {
            updatedMusic.votes += 1
            voteData.push({ musicId })

            try {
              await api.put(`/api/${pageName}/${updatedMusic.id}/vote`)
            } catch (error) {
              console.error(error)
              throw error
            }
          }

          return updatedMusic
        })
      )
    }

    localStorage.setItem(`ranking-${pageName}-hebert-v1@userVoteData`, JSON.stringify(voteData))

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
        <h1>{pageDescription}</h1>

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
                        return <Music key={music.id || '123'} music={music} index={index} handleVote={handleVote} />
                      }
                    })
                  : musics.map((music, index) => {
                      return <Music key={music.id || '123'} music={music} index={index} handleVote={handleVote} />
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
