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
  handleVote: (musicId: string | undefined, newMusic: MusicData | undefined) => void
}

export function Music({ music, index, handleVote }: MusicProps) {
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
        <button type="button" onClick={() => handleVote(music.id, newMusic)}>
          Votar
        </button>
      </td>
    </tr>
  )
}
