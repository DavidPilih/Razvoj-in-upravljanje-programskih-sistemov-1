import { Chest, Dragon } from './art'
import './scenes.css'

export default function DragonHoard({ answers, total, feedback, finished }) {
  const coins = answers.filter(item => item.correct).length
  const mood = finished ? 'is-finished' : !feedback ? 'is-sleeping' : feedback.correct ? 'is-won' : 'is-kept'
  const caption = finished ? `Zlatniki v skrinji: ${coins} od ${total}`
    : !feedback ? 'Zmaj straži zaklad. Vsak pravilen odgovor ti prinese zlatnik!'
    : feedback.correct ? 'Zlatnik je tvoj!' : 'Ta zlatnik je zmaj obdržal.'

  return <div className="scene-group">
    <div className={`scene hoard ${mood}${coins ? ' has-gold' : ''}`}>
      <ol className="hoard-slots" aria-hidden="true">{Array.from({ length: total }, (_, slot) => <li key={slot} className={answers[slot] ? (answers[slot].correct ? 'is-gold' : 'is-lost') : ''} />)}</ol>
      <span className="torch torch-a" aria-hidden="true" />
      <span className="torch torch-b" aria-hidden="true" />
      <div className="hoard-dragon"><Dragon /><span className="dragon-zzz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span><span className="dragon-smoke" aria-hidden="true"><i /><i /><i /></span></div>
      <div className="hoard-chest"><Chest /></div>
      <span className="flying-coin" aria-hidden="true" />
    </div>
    <p className="scene-caption">{caption}</p>
  </div>
}
