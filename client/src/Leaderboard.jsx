import { useEffect, useState } from 'react'
import { titleFor } from './titles'

const boards = { total: 'Skupno', math: 'Matematika', history: 'Zgodovina', duel: 'ELO' }

async function api(path, signal) {
  let response
  try {
    response = await fetch(`/api/${path}`, { credentials: 'include', signal })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new Error('Povezava s strežnikom ni uspela. Poskusi znova.', { cause: err })
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'Lestvice ni bilo mogoče naložiti.')
  return data
}

function Row({ entry, board }) {
  return <li className={`board-row${entry.me ? ' is-me' : ''}${entry.rank <= 3 ? ` is-top-${entry.rank}` : ''}`}>
    <span className="board-rank">{entry.rank}.</span>
    <span className="board-name">{entry.nickname}{entry.me ? ' (ti)' : ''}
      <small>{entry.grade}. razred · {titleFor(entry.rating).current.name}</small>
    </span>
    <span className="board-value">{entry.value} {board === 'duel' ? 'ELO' : 't.'}</span>
  </li>
}

export default function Leaderboard({ student, onBack }) {
  const [board, setBoard] = useState('total')
  const [grade, setGrade] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const query = `leaderboard?by=${board}${grade ? `&grade=${grade}` : ''}`
  const data = result?.query === query ? result : null

  useEffect(() => {
    const controller = new AbortController()
    api(query, controller.signal)
      .then(next => setResult({ ...next, query }))
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [query, attempt])

  return <section className="quiz-panel leaderboard-panel">
    <button className="text-button back-button" onClick={onBack}>← Nazaj na glavno stran</button>
    <h1>Lestvica</h1>
    <p className="intro">Najboljših 20 vitezov kraljestva. Na lestvici je prikazan samo vzdevek.</p>
    <nav className="auth-switch board-tabs" aria-label="Vrsta lestvice">
      {Object.entries(boards).map(([value, label]) => <button key={value} type="button" aria-pressed={board === value} onClick={() => { setError(''); setBoard(value) }}>{label}</button>)}
    </nav>
    <label className="board-filter">Razred<select value={grade} onChange={event => { setError(''); setGrade(event.target.value) }}>
      <option value="">Vsi razredi</option>
      {[7, 8, 9].map(value => <option key={value} value={value}>{value}. razred</option>)}
    </select></label>
    {board === 'duel' && <p className="hint">Vsi začnejo s 1000 ELO. Pravilni odgovori ga dvignejo, napačni znižajo, v viteških dvobojih pa je zmaga proti močnejšemu nasprotniku vredna več.</p>}
    {error ? <>
      <p className="notice" role="alert">{error}</p>
      <button className="primary-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Poskusi znova</button>
    </> : !data ? <p role="status">Nalaganje lestvice …</p> : !data.entries.length ? <p className="intro">Na tej lestvici še ni nikogar.</p> : <ol className="board">
      {data.entries.map(entry => <Row key={entry.nickname} entry={entry} board={board} />)}
      {data.me && <>
        <li className="board-gap" aria-hidden="true">⋯</li>
        <Row entry={data.me} board={board} />
      </>}
    </ol>}
    {!student && <p className="hint">Prijavi se, da se tvoje točke shranjujejo in se uvrstiš na lestvico.</p>}
  </section>
}
