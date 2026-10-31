import { Horse } from './art'
import './scenes.css'

const coats = ['#a5683a', '#d9a066', '#6b4226', '#e8dcc8', '#8d8d94']

export default function HorseRace({ room }) {
  const total = room.total || 10
  const started = room.status === 'reveal' || room.status === 'finished' || (room.status === 'question' && room.index > 0)
  const place = player => 1 + room.players.filter(other => other.score > player.score).length
  const me = room.players.find(player => player.id === room.playerId)
  const compact = room.players.length > 8

  return <div className={`scene race${compact ? ' race-compact' : ''} race-${room.status}`}>
    <p className="race-place" role="status">{started ? <>Tvoje mesto: <strong>{place(me)}.</strong> od {room.players.length}</> : 'Konji so pripravljeni na štart!'}</p>
    <ol className="race-track">{room.players.map((player, lane) => {
      const running = room.status === 'question' || (room.status === 'reveal' && player.correct)
      return <li key={player.id} className={`race-lane${player.id === room.playerId ? ' is-me' : ''}${player.left ? ' is-gone' : ''}`}>
        <span className="race-rank">{started ? `${place(player)}.` : '–'}</span>
        <span className="race-name">{player.nickname}</span>
        <span className="race-turf">
          <span className={`race-runner${running ? ' is-running' : ''}${room.status === 'reveal' && player.correct ? ' is-sprinting' : ''}`} style={{ '--progress': player.score / total }}>
            <Horse coat={coats[lane % coats.length]} silk={`hsl(${lane * 137.5} 65% 42%)`} crown={room.status === 'finished' && place(player) === 1} />
          </span>
        </span>
      </li>
    })}</ol>
  </div>
}
