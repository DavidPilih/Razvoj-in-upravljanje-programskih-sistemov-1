import { useEffect, useState } from 'react'
import { Crest } from './art'
import { titleFor } from './titles'

const subjects = { math: 'Matematika', history: 'Zgodovina' }

async function api(path, method = 'GET', body, signal) {
  let response
  try {
    response = await fetch(`/api/${path}`, {
      method, credentials: 'include', signal,
      headers: { 'Content-Type': 'application/json' },
      ...(body && { body: JSON.stringify(body) }),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new Error('Povezava s strežnikom ni uspela. Poskusi znova.', { cause: err })
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'Zahteva ni uspela.')
  return data
}

export default function Profile({ onBack, onUpdate, onDeleted }) {
  const [profile, setProfile] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api('profile', 'GET', undefined, controller.signal)
      .then(data => { setProfile(data); onUpdate(data.student) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [attempt, onUpdate])

  async function save(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const payload = { nickname: values.nickname.trim(), grade: Number(values.grade), classLabel: values.classLabel.trim() }
    setError('')
    setMessage('')
    if (!payload.nickname) {
      setError('Vnesi vzdevek.')
      return
    }
    setBusy(true)
    try {
      onUpdate(await api('profile', 'PATCH', payload))
      setMessage('Profil je posodobljen.')
      setAttempt(attempt + 1)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function remove() {
    setBusy(true)
    setDeleteError('')
    try {
      await api('auth/me', 'DELETE')
      onDeleted()
    } catch (err) {
      setDeleteError(err.message)
      setBusy(false)
    }
  }

  if (!profile) return <section className="quiz-panel profile-panel">
    <button className="text-button back-button" onClick={onBack}>← Nazaj na glavno stran</button>
    <h1>Profil</h1>
    {error ? <>
      <p className="notice" role="alert">{error}</p>
      <button className="primary-button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Poskusi znova</button>
    </> : <p role="status">Nalaganje profila …</p>}
  </section>

  const { student, rank } = profile
  const { current, next } = titleFor(student.totalScore)
  const { correctAnswers, totalAnswers } = student.stats
  const accuracy = totalAnswers ? Math.round(correctAnswers / totalAnswers * 100) : 0

  return <section className="quiz-panel profile-panel">
    <button className="text-button back-button" disabled={busy} onClick={onBack}>← Nazaj na glavno stran</button>
    <div className="profile-head">
      <Crest />
      <div>
        <h1>{student.nickname}</h1>
        <p className="profile-title">{current.name}</p>
      </div>
    </div>
    <p className="intro">{student.firstName} {student.lastName} · {student.grade}. razred{student.classLabel ? ` · ${student.classLabel}` : ''}</p>
    <div className="title-progress">
      {next ? <>
        <p>Do naziva <strong>{next.name}</strong> ti manjka še <strong>{next.points - student.totalScore}</strong> točk.</p>
        <progress value={student.totalScore - current.points} max={next.points - current.points} aria-label={`Napredek do naziva ${next.name}`} />
      </> : <p>Dosegel si najvišji naziv. Čestitke!</p>}
    </div>
    <dl className="stat-grid">
      <div><dt>Skupne točke</dt><dd>{student.totalScore}</dd></div>
      <div><dt>Mesto na lestvici</dt><dd>{rank.overall}.</dd></div>
      <div><dt>Mesto v {student.grade}. razredu</dt><dd>{rank.grade}.</dd></div>
      <div><dt>ELO</dt><dd>{student.duelRating}</dd></div>
      <div><dt>Pravilni odgovori</dt><dd>{correctAnswers} / {totalAnswers}</dd>{totalAnswers > 0 && <span className="hint">{accuracy} % pravilnih</span>}</div>
    </dl>

    <h2 className="section-title">Točke po predmetih</h2>
    <ul className="player-list">{Object.entries(subjects).map(([key, label]) => <li key={key}>
      <span>{label}</span><span>{student.scoreBySubject?.[key] ?? 0} t.</span>
    </li>)}</ul>

    <h2 className="section-title">Uredi profil</h2>
    {message && <p className="notice" role="status">{message}</p>}
    {error && <p className="notice" role="alert">{error}</p>}
    <form key={student.updatedAt} onSubmit={save}>
      <fieldset disabled={busy}>
        <label>Vzdevek<input name="nickname" defaultValue={student.nickname} maxLength={30} required /><span className="hint">Ime, ki ga drugi vidijo na lestvici.</span></label>
        <div className="form-row">
          <label>Razred<select name="grade" defaultValue={student.grade}>{[7, 8, 9].map(grade => <option key={grade} value={grade}>{grade}. razred</option>)}</select></label>
          <label>Oddelek (neobvezno)<input name="classLabel" defaultValue={student.classLabel || ''} maxLength={10} placeholder="npr. 7.a" /></label>
        </div>
        <button className="primary-button">{busy ? 'Shranjevanje …' : 'Shrani spremembe'}</button>
      </fieldset>
    </form>

    <h2 className="section-title">Izbris računa</h2>
    {deleteError && <p className="notice" role="alert">{deleteError}</p>}
    {confirmDelete ? <div className="delete-confirm">
      <p>Res želiš izbrisati račun? Izgubil boš vse točke in naziv. Tega ni mogoče razveljaviti.</p>
      <button className="danger-button" disabled={busy} onClick={remove}>{busy ? 'Brisanje …' : 'Da, izbriši račun'}</button>
      <button className="text-button" disabled={busy} onClick={() => setConfirmDelete(false)}>Prekliči</button>
    </div> : <button className="danger-button" disabled={busy} onClick={() => setConfirmDelete(true)}>Izbriši račun</button>}
  </section>
}
