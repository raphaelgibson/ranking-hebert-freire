import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { Header, Music, type MusicData, type Vote } from '../../components'
import { api } from '../../libs/axios'
import './styles.scss'

type RankingPageProps = {
  pageName: string
  pageDescription: string
}

type MusicDataUpdate = {
  id: string
  name: string
  singer?: string
}

export function RankingPage({ pageName, pageDescription }: RankingPageProps) {
  const [user, setUser] = useState<{ accessToken: string }>()
  const [musics, setMusics] = useState<MusicData[]>(() => [])
  const [filteredMusics, setFilteredMusics] = useState<MusicData[]>([])
  const [musicToSearch, setMusicToSearch] = useState('')
  const [singerToSearch, setSingerToSearch] = useState('')
  const [selectedMusicToUpdate, setSelectedMusicToUpdate] = useState<MusicDataUpdate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const navigate = useNavigate()

  const unexpectedErrorMessage = 'Ocorreu um erro inesperado, tente novamente mais tarde.'

  async function fetchAllMusics() {
    try {
      const { data }: { data: MusicData[] } = await api.get(`/api/${pageName}`)
      const musicDataWithVisible = data.map(music => ({
        ...music,
        visible: true
      }))
      setMusics(musicDataWithVisible)
    } catch (error) {
      console.error(error)
      toast.error(unexpectedErrorMessage)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('rankings-hebert-v1@userData')

    if (userData) {
      const userDataParsed = JSON.parse(userData)
      setUser(userDataParsed)
    }
  }, [])

  useEffect(() => {
    fetchAllMusics()
  }, [])

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
    fetchAllMusics()
  }

  async function handleVote(musicId: string | undefined = undefined, newMusic: MusicData | undefined = undefined) {
    const userVoteData = localStorage.getItem(`ranking-${pageName}-hebert-v1@userVoteData`)
    let voteData: Vote[] = []

    if (userVoteData) {
      voteData = JSON.parse(userVoteData)

      if (voteData.length >= 3) {
        await Swal.fire({
          icon: 'warning',
          title: 'Atenção!',
          text: 'Você atingiu o limite de 3 votos!',
          confirmButtonColor: '#c202ff',
          background: '#121212',
          color: '#fff'
        })
        return
      }

      if (voteData.some(vote => vote.musicId === musicId)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Atenção!',
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

    handleSetMusics(updatedMusics)

    toast.success('Seu voto foi computado com sucesso!')
  }

  function handleSetMusics(updatedMusics: MusicData[]) {
    updatedMusics.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes
      }

      return a.name.localeCompare(b.name)
    })

    setMusics(updatedMusics)
  }

  async function handleUpdate(musicDataUpdate: MusicDataUpdate): Promise<void> {
    try {
      await api.put(`/api/${pageName}/${musicDataUpdate.id}`, musicDataUpdate, {
        headers: {
          'x-access-token': user?.accessToken
        }
      })

      await fetchAllMusics()

      toast.success('Música atualizada com sucesso!')
    } catch (error) {
      const errorData = error as { message: string; status?: number }

      if (errorData.status === 401) {
        localStorage.removeItem('rankings-hebert-v1@userData')
        navigate('/login')
      } else if (errorData.status === 403) {
        localStorage.removeItem('rankings-hebert-v1@userData')
        navigate('/')
      } else {
        console.error(errorData.message)
        toast.error(errorData.message || unexpectedErrorMessage)
      }
    }

    closeDialog()
  }

  async function handleDelete(musicId: string | undefined): Promise<void> {
    if (!musicId) {
      return
    }

    const actionResult = await Swal.fire({
      icon: 'question',
      title: 'Você realmente deseja excluir essa música?',
      background: '#121212',
      color: '#fff',
      showCancelButton: true,
      cancelButtonText: 'Não',
      confirmButtonText: 'Sim',
      customClass: {
        cancelButton: 'primaryButton',
        confirmButton: 'secondaryButton'
      }
    })

    if (!actionResult.isConfirmed) {
      return
    }

    try {
      await api.delete(`/api/${pageName}/${musicId}`, {
        headers: {
          'x-access-token': user?.accessToken
        }
      })

      await fetchAllMusics()

      toast.success('Música excluída com sucesso!')
    } catch (error) {
      const errorData = error as { message: string; status?: number }

      if (errorData.status === 401) {
        localStorage.removeItem('rankings-hebert-v1@userData')
        navigate('/login')
      } else if (errorData.status === 403) {
        localStorage.removeItem('rankings-hebert-v1@userData')
        navigate('/')
      } else {
        console.error(errorData.message)
        toast.error(errorData.message || unexpectedErrorMessage)
      }
    }
  }

  function openDialog(musicToUpdate?: MusicDataUpdate) {
    if (!musicToUpdate) {
      return
    }

    setSelectedMusicToUpdate(musicToUpdate)
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setSelectedMusicToUpdate(null)
    setIsDialogOpen(false)
  }

  async function handleSyncRanking() {
    setFilteredMusics([])
    try {
      await fetchAllMusics()
      toast.success('Ranking atualizado!', {
        autoClose: 2000,
        pauseOnHover: false
      })
    } catch (error) {
      console.error(error)
      toast.error(unexpectedErrorMessage)
    }
  }

  return (
    <div>
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Overlay className="dialogOverlay" />
        <Header />
        <main>
          <h1>{pageDescription}</h1>

          <div className="musicsContainer">
            <form className="formContainer" autoCapitalize="words" autoComplete="off">
              <input
                id="musicName"
                type="text"
                placeholder="Informe o nome da música"
                value={musicToSearch}
                onChange={e => setMusicToSearch(e.target.value)}
              />
              <input
                id="musicSinger"
                type="text"
                placeholder="Informe o nome do artista"
                value={singerToSearch}
                onChange={e => setSingerToSearch(e.target.value)}
              />
              <div className="buttonsGroup">
                <button className="primaryButton" type="button" onClick={handleSearch}>
                  Pesquisar
                </button>
                <button className="secondaryButton" type="button" onClick={handleCleanSearch}>
                  Limpar pesquisa
                </button>
              </div>
              <button className="primaryButton updateRankingButton" type="button" onClick={handleSyncRanking}>
                Atualizar ranking
              </button>
            </form>

            <div className="tableContainer">
              <table border={1}>
                <thead>
                  <tr>
                    <th />
                    <th>Música</th>
                    <th>Votos</th>
                    <th />
                    {user && (
                      <>
                        <th />
                        <th />
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredMusics.length > 0
                    ? filteredMusics.map((music, index) => {
                        if (music.visible) {
                          return (
                            <Music
                              key={music.id || '123'}
                              music={music}
                              index={index}
                              handleVote={handleVote}
                              handleDelete={handleDelete}
                              onEdit={() =>
                                openDialog(
                                  music.id ? { id: music.id, name: music.name, singer: music.singer } : undefined
                                )
                              }
                              user={user}
                            />
                          )
                        }
                      })
                    : musics.map((music, index) => {
                        return (
                          <Music
                            key={music.id || '123'}
                            music={music}
                            index={index}
                            handleVote={handleVote}
                            handleDelete={handleDelete}
                            onEdit={() =>
                              openDialog(
                                music.id ? { id: music.id, name: music.name, singer: music.singer } : undefined
                              )
                            }
                            user={user}
                          />
                        )
                      })}
                </tbody>
              </table>
              {selectedMusicToUpdate && (
                <Dialog.Portal>
                  <Dialog.Content className="dialogContent">
                    <Dialog.Title className="dialogTitle">Atualizar música</Dialog.Title>
                    <Dialog.Description />

                    <form autoCapitalize="words" autoComplete="off">
                      <div className="formContainer">
                        <input
                          id="nameToUpdate"
                          type="text"
                          placeholder="Informe o nome da música"
                          value={selectedMusicToUpdate.name}
                          onChange={e => setSelectedMusicToUpdate({ ...selectedMusicToUpdate, name: e.target.value })}
                        />
                        <input
                          id="singerToUpdate"
                          type="text"
                          placeholder="Informe o nome do artista"
                          value={selectedMusicToUpdate.singer}
                          onChange={e => setSelectedMusicToUpdate({ ...selectedMusicToUpdate, singer: e.target.value })}
                        />
                        <div className="buttonsGroup">
                          <Dialog.Close asChild>
                            <button type="button" className="secondaryButton">
                              Cancelar
                            </button>
                          </Dialog.Close>
                          <Dialog.Close asChild>
                            <button
                              type="button"
                              className="primaryButton"
                              onClick={() => handleUpdate(selectedMusicToUpdate)}
                            >
                              Atualizar
                            </button>
                          </Dialog.Close>
                        </div>
                      </div>
                    </form>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </div>
          </div>
        </main>
      </Dialog.Root>
    </div>
  )
}
