import { Knight } from './art'
import './scenes.css'

const stars = [-60, -20, 25, 70, 120]

function Fighter({ side, color, player, action, ready }) {
  return <div className={`duel-fighter duel-fighter-${side} ${action}`}>
    {ready && <span className="duel-ready" aria-hidden="true">✓</span>}
    <Knight color={color} />
    {action === 'is-hit' && <span className="hit-stars" aria-hidden="true">{stars.map(angle => <i key={angle} style={{ '--angle': `${angle}deg` }}>★</i>)}</span>}
    <span className="sr-only">{player?.nickname}</span>
  </div>
}

function poses(room, me, opponent) {
  const gone = !opponent || opponent.left
  if (room.status === 'reveal') {
    if (gone) return { mine: '', theirs: 'is-gone', callout: me?.correct ? 'Pravilno!' : 'Ojoj!' }
    // Each screen follows its own player: a correct answer lands your hit, anything else lands theirs.
    return me?.correct
      ? { mine: 'is-slashing', theirs: 'is-hit', callout: 'Zadetek!' }
      : { mine: 'is-hit', theirs: 'is-slashing', callout: 'Ojoj!' }
  }
  if (room.status === 'finished') {
    if (me.score === opponent?.score) return { mine: 'is-cheering', theirs: gone ? 'is-gone' : 'is-cheering', callout: 'Neodločeno!' }
    if (me.score > (opponent?.score ?? -1)) return { mine: 'is-cheering', theirs: gone ? 'is-gone' : 'is-down', callout: 'Zmaga!' }
    return { mine: 'is-down', theirs: gone ? 'is-gone' : 'is-cheering', callout: 'Več sreče prihodnjič!' }
  }
  return { mine: 'is-idle', theirs: gone ? (opponent ? 'is-gone' : 'is-waiting') : 'is-idle' }
}

export default function DuelScene({ room }) {
  const me = room.players.find(player => player.id === room.playerId)
  const opponent = room.players.find(player => player.id !== room.playerId)
  const { mine, theirs, callout } = poses(room, me, opponent)
  const asking = room.status === 'question'
  return <div className="scene duel-stage">
    <div className="duel-backdrop" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
    <p className="duel-banner duel-banner-me"><span>{me?.nickname}</span><strong>{me?.score}</strong></p>
    <p className="duel-banner duel-banner-them"><span>{opponent?.nickname || 'Čakamo nasprotnika …'}</span><strong>{opponent ? opponent.score : '–'}</strong></p>
    <Fighter side="me" color="#2f5fa8" player={me} action={mine} ready={asking && me?.answered} />
    <Fighter side="them" color="#c0392b" player={opponent} action={theirs} ready={asking && opponent?.answered} />
    {callout && <p className="scene-callout" key={callout}>{callout}</p>}
  </div>
}
