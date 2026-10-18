import { useEffect, useState } from 'react'
import './App.css'
import DailyQuiz from './DailyQuiz'
import Klasicno from './Klasicno'
import Multiplayer from './Multiplayer'

async function request(path, body) {
  let response
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(body && { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error('Povezava s strežnikom ni uspela. Poskusi znova.')
  }
  const data = await response.json().catch(() => null)
  if (path === 'me' && response.status === 401) return null
  if (!response.ok) throw new Error(data?.error === 'Napaka'
    ? 'Registracija ni uspela. Preveri podatke; uporabniško ime ali vzdevek je morda že zaseden.'
    : data?.error || 'Zahteva ni uspela. Poskusi znova.')
  if (!data) throw new Error('Strežnik ni vrnil veljavnega odgovora.')
  return data
}

function App() {
  const [mode, setMode] = useState('home')
  const [daily, setDaily] = useState(false)
  const [klasicno, setKlasicno] = useState(false)
  const [multiplayer, setMultiplayer] = useState(null)
  const [student, setStudent] = useState(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const registering = mode === 'register'

  useEffect(() => {
    let active = true
    request('me')
      .then(user => { if (active) setStudent(user) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  function changeMode(next) {
    setMode(next)
    setError('')
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setError('')
    setMessage('')
    if (registering && values.password !== values.confirmPassword) {
      setError('Gesli se ne ujemata.')
      return
    }
    const payload = { username: values.username.trim().toLowerCase(), password: values.password }
    if (registering) {
      Object.assign(payload, {
        firstName: values.firstName.trim(), lastName: values.lastName.trim(),
        nickname: values.nickname.trim(), grade: Number(values.grade), classLabel: values.classLabel.trim(),
      })
      if (!payload.firstName || !payload.lastName || !payload.nickname) {
        setError('Vnesi ime, priimek in vzdevek.')
        return
      }
    }
    setBusy(true)
    try {
      const user = await request(registering ? 'register' : 'login', payload)
      if (registering) {
        setUsername(payload.username)
        setMode('login')
        setMessage('Račun je ustvarjen. Zdaj se lahko prijaviš.')
      } else {
        setStudent(user)
        setMode('home')
      }
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  async function logout() {
    setBusy(true)
    setError('')
    try {
      await request('logout', {})
      setStudent(null)
      setMode('home')
      setDaily(false)
      setKlasicno(false)
      setMultiplayer(null)
      setMessage('Uspešno si se odjavil.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <main className="auth-page">
      <header className="site-header">
        <button className="brand home-button" disabled={busy} onClick={() => { setMode('home'); setDaily(false); setKlasicno(false); setMultiplayer(null); setError(''); setMessage('') }}>KQviz</button>
        <nav className="account-nav" aria-label="Uporabniški račun">
          {checking ? <span role="status">Preverjanje prijave …</span> : student ? <>
            <span>{student.nickname}</span><button className="text-button" onClick={logout} disabled={busy}>Odjava</button>
          </> : <>
            <button className="text-button" onClick={() => changeMode('login')} disabled={busy}>Prijava</button>
            <button className="outline-button" onClick={() => changeMode('register')} disabled={busy}>Registracija</button>
          </>}
        </nav>
      </header>
      {mode === 'home' ? <div className="home-content">
        {error && <p className="notice" role="alert">{error}</p>}
        {message && <p className="notice" role="status">{message}</p>}
        {multiplayer ? <Multiplayer key={multiplayer} mode={multiplayer} student={student} onBack={() => setMultiplayer(null)} /> : klasicno ? <Klasicno student={student} onBack={() => setKlasicno(false)} /> : daily ? <DailyQuiz student={student} onBack={() => setDaily(false)} /> : <>
          <h1>Izberi kviz</h1>
          <div className="quiz-grid">
            <button className="quiz-choice" disabled={checking || busy} onClick={() => {
              setError(''); setMessage(''); setDaily(true)
            }}><span className="choice-title">Daily</span><span>5 naključnih vprašanj iz različnih predmetov.</span><span className="choice-action">Začni kviz →</span></button>
            <button className="quiz-choice" disabled={checking || busy} onClick={() => { setError(''); setMessage(''); setKlasicno(true) }}>
              <span className="choice-title">Klasično</span><span>Izberi razred in predmet. Rešuj sklope po 10 vprašanj.</span><span className="choice-action">Izberi kviz →</span>
            </button>
            {[
              ['Skupinsko', 'Tekmuj s prijatelji v skupnem kvizu.', 'group'],
              ['1v1', 'Pomerita se v dvoboju znanja.', 'duel'],
            ].map(([title, description, gameMode]) => <button className="quiz-choice" key={title} disabled={checking || busy} onClick={() => { setError(''); setMessage(''); setMultiplayer(gameMode) }}><span className="choice-title">{title}</span><span>{description}</span><span className="choice-action">Ustvari sobo ali se pridruži →</span></button>)}
          </div>
        </>}
      </div> : <div className="auth-container">
        <button className="text-button back-button" disabled={busy} onClick={() => changeMode('home')}>← Nazaj na glavno stran</button>
        <section className="auth-card" aria-labelledby="auth-title">
          {checking ? <h1 id="auth-title" role="status">Preverjanje prijave …</h1> : student ? (
            <>
              <h1 id="auth-title">Živjo, {student.nickname}.</h1>
              <p className="intro">Uspešno si prijavljen.</p>
              <dl className="account-details">
                <div><dt>Uporabniško ime</dt><dd>{student.username}</dd></div>
                <div><dt>Razred</dt><dd>{student.grade}. razred</dd></div>
              </dl>
              {error && <p className="notice" role="alert">{error}</p>}
              <button className="primary-button" onClick={logout} disabled={busy}>{busy ? 'Odjavljanje …' : 'Odjava'}</button>
            </>
          ) : (
            <>
              <nav className="auth-switch" aria-label="Uporabniški račun">
                <button type="button" aria-pressed={!registering} disabled={busy} onClick={() => changeMode('login')}>Prijava</button>
                <button type="button" aria-pressed={registering} disabled={busy} onClick={() => changeMode('register')}>Registracija</button>
              </nav>
              <h1 id="auth-title">{registering ? 'Ustvari račun' : 'Dobrodošel nazaj'}</h1>
              <p className="intro">{registering ? 'Vnesi podatke za svoj uporabniški račun.' : 'Za nadaljevanje se prijavi v svoj račun.'}</p>
              {message && <p className="notice" role="status">{message}</p>}
              {error && <p className="notice" role="alert">{error}</p>}
              <form key={mode} onSubmit={submit}>
                <fieldset disabled={busy}>
                  {registering && <>
                    <div className="form-row">
                      <label>Ime<input name="firstName" autoComplete="given-name" required /></label>
                      <label>Priimek<input name="lastName" autoComplete="family-name" required /></label>
                    </div>
                    <label>Vzdevek<input name="nickname" maxLength={30} required /><span className="hint">Ime, ki ga bodo videli drugi uporabniki.</span></label>
                  </>}
                  <label>Uporabniško ime
                    <input name="username" defaultValue={username} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={registering ? 3 : undefined} maxLength={30} pattern={registering ? '[a-zA-Z0-9_.]+' : undefined} required />
                    {registering && <span className="hint">3–30 znakov: črke a–z, številke, pika ali podčrtaj.</span>}
                  </label>
                  {registering && <div className="form-row">
                    <label>Razred<select name="grade" defaultValue="" required><option value="" disabled>Izberi razred</option>{[7, 8, 9].map(grade => <option key={grade} value={grade}>{grade}. razred</option>)}</select></label>
                    <label>Oddelek (neobvezno)<input name="classLabel" placeholder="npr. 7.a" /></label>
                  </div>}
                  <label>Geslo<input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} required />{registering && <span className="hint">Najmanj 8 znakov.</span>}</label>
                  {registering && <label>Ponovi geslo<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>}
                  <button className="primary-button" type="submit">{busy ? 'Počakaj …' : registering ? 'Ustvari račun' : 'Prijavi se'}</button>
                </fieldset>
              </form>
              <p className="form-footer">{registering ? 'Že imaš račun?' : 'Še nimaš računa?'}{' '}<button className="text-button" disabled={busy} onClick={() => changeMode(registering ? 'login' : 'register')}>{registering ? 'Prijavi se' : 'Registriraj se'}</button></p>
            </>
          )}
        </section>
      </div>}
    </main>
  )
}

export default App
