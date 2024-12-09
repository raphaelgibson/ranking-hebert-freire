import { Pencil, Trash } from 'phosphor-react'
import './styles.scss'

export type MusicData = {
  id?: string
  name: string
  singer?: string
  votes: number
  visible: boolean
}

export type Vote = {
  musicId: string
}

type MusicProps = {
  music: MusicData
  index: number
  user?: any
  handleVote: (musicId: string | undefined, newMusic: MusicData | undefined) => void
  handleDelete: (musicId: string | undefined) => Promise<void>
  onEdit: () => void
}

export function Music({ music, index, user, handleVote, handleDelete, onEdit }: MusicProps) {
  const newMusic = music.votes === 0 ? music : undefined

  return (
    <tr className="music">
      <td>{index + 1}</td>
      {music.singer ? (
        <td className="musicDetails">
          <span className="musicName">{music.name}</span>
          <span className="musicSinger">{music.singer}</span>
        </td>
      ) : (
        <td>
          <span className="musicName">{music.name}</span>
        </td>
      )}
      <td>{music.votes}</td>
      <td>
        <button type="button" className="voteButton" onClick={() => handleVote(music.id, newMusic)}>
          Votar
        </button>
      </td>
      {user && music.id && (
        <>
          <td>
            <button type="button" className="iconButton" onClick={onEdit}>
              <Pencil size={24} color="green" />
            </button>
          </td>
          <td>
            <button type="button" className="iconButton" onClick={() => handleDelete(music.id)}>
              <Trash size={24} color="#972b20" />
            </button>
          </td>
        </>
      )}
    </tr>
  )
}
