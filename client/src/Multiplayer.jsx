import { useEffect, useRef, useState } from 'react'

const subjectNames = { math: 'Matematika', history: 'Zgodovina' }

export default function Multiplayer({ mode, student, onBack }) {
  const [room, setRoom] = useState(null)
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState({ questionId: '', value: '' })
  const [now, setNow] = useState(() => Date.now())
  const socketRef = useRef(null)
  const storageKey = `kviz-room-${mode}`
  const title = mode === 'duel' ? '1v1' : 'Skupinsko'

  useEffect(() => {
    let active = true
    let retry
    let socket
    let resuming = false
    function connect() {
      socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/multiplayer`)
      socketRef.current = socket
      socket.onopen = () => {
        if (!active) return socket.close()
        setConnected(true)
        setError('')
        try {
          const saved = JSON.parse(sessionStorage.getItem(storageKey))
          if (saved) {
            resuming = true
            setBusy(true)
            socket.send(JSON.stringify({ type: 'resume', ...saved }))
          }
        } catch { sessionStorage.removeItem(storageKey) }
      }
      socket.onmessage = event => {
        if (!active) return
        const data = JSON.parse(event.data)
        setBusy(false)
        if (data.type === 'joined') {
          sessionStorage.setItem(storageKey, JSON.stringify({ code: data.code, token: data.token }))
        } else if (data.type === 'state') {
          resuming = false
          setRoom(data.room)
          setError('')
        } else if (data.type === 'left' || data.type === 'expired') {
          sessionStorage.removeItem(storageKey)
          setRoom(null)
          if (data.error) setError(data.error)
        } else if (data.type === 'error') {
          setError(data.error)
          // A failed resume must not trap the tab in an expired room.
          if (resuming) {
            sessionStorage.removeItem(storageKey)
            setRoom(null)
            resuming = false
          }
        }
      }
      socket.onerror = () => { if (active) setError('Povezava s strežnikom ni uspela.') }
      socket.onclose = () => {
        if (!active) return
        setConnected(false)
        setBusy(false)
        retry = setTimeout(connect, 1500)
      }
    }
    connect()
    return () => { active = false; clearTimeout(retry); socket.close() }
  }, [storageKey])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])

  function send(data) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError('Počakaj na povezavo s strežnikom.')
      return
    }
    setError('')
    setBusy(true)
    socketRef.current.send(JSON.stringify(data))
  }

  function leave() {
    if (socketRef.current?.readyState === WebSocket.OPEN && room) {
      socketRef.current.send(JSON.stringify({ type: 'leave' }))
    }
    sessionStorage.removeItem(storageKey)
    onBack()
  }

  const disabled = busy || !connected
  const me = room?.players.find(player => player.id === room.playerId)
  const leaderboard = room ? [...room.players].sort((a, b) => b.score - a.score) : []
  const winners = leaderboard.filter(player => player.score === leaderboard[0]?.score)
  const seconds = room?.deadline ? Math.max(0, Math.ceil((room.deadline - now) / 1000)) : 0
  const currentAnswer = answer.questionId === room?.question?.id ? answer.value : ''

  return <section className="multiplayer-panel quiz-panel">
    <button className="text-button back-button" onClick={leave}>← Zapusti in nazaj</button>
    <h1>{title}</h1>
    {!connected && <p className="notice" role="status">Povezovanje s strežnikom …</p>}
    {error && <p className="notice" role="alert">{error}</p>}
    {!room ? <>
      <p className="intro">Ustvari sobo ali se pridruži s kodo.</p>
      <div className="room-forms">
        <form onSubmit={event => { event.preventDefault(); send({ ...Object.fromEntries(new FormData(event.currentTarget)), type: 'create', mode }) }}>
          <h2>Ustvari sobo</h2>
          <fieldset disabled={disabled}>
            <label>Vzdevek<input name="nickname" defaultValue={student?.nickname || ''} maxLength={30} required /></label>
            <label>Razred<select name="grade" defaultValue={student?.grade || 7}>{[7, 8, 9].map(grade => <option key={grade} value={grade}>{grade}. razred</option>)}</select></label>
            <label>Predmet<select name="subject"><option value="math">Matematika</option><option value="history">Zgodovina</option></select></label>
            <button className="primary-button">Ustvari sobo</button>
          </fieldset>
        </form>
        <form onSubmit={event => { event.preventDefault(); send({ ...Object.fromEntries(new FormData(event.currentTarget)), type: 'join', mode }) }}>
          <h2>Pridruži se</h2>
          <fieldset disabled={disabled}>
            <label>Vzdevek<input name="nickname" defaultValue={student?.nickname || ''} maxLength={30} required /></label>
            <label>Koda sobe<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" required /></label>
            <button className="primary-button">Pridruži se</button>
          </fieldset>
        </form>
      </div>
    </> : <>
      <p className="room-code">Koda sobe: <strong>{room.code}</strong></p>
      <p className="intro">{room.grade}. razred · {subjectNames[room.subject]} · 10 vprašanj · 1 točka za pravilen odgovor</p>
      {room.status === 'waiting' || room.status === 'loading' ? <>
        <h2>Čakalnica</h2>
        <ul className="player-list">{room.players.map(player => <li key={player.id}>
          <span>{player.nickname}{player.id === room.playerId ? ' (ti)' : ''}{player.id === room.hostId ? ' · gostitelj' : ''}</span>
          <span>{player.connected ? 'Pripravljen' : 'Povezava prekinjena'}</span>
        </li>)}</ul>
        <p className="intro">{mode === 'duel' ? 'Za dvoboj potrebujeta dva igralca.' : 'V sobi je lahko od 2 do 20 igralcev.'} Vsako vprašanje ima 30 sekund časa.</p>
        {room.playerId === room.hostId ? <button className="primary-button" disabled={disabled || room.status === 'loading' || room.players.length < 2 || room.players.some(player => !player.connected)} onClick={() => send({ type: 'start' })}>{room.status === 'loading' ? 'Nalaganje vprašanj …' : 'Začni igro'}</button> : <p role="status">Počakaj, da gostitelj začne igro.</p>}
      </> : room.status === 'finished' ? <>
        <h2>Konec igre</h2>
        <p className="intro">{winners.length > 1 ? `Neodločeno: ${winners.map(player => player.nickname).join(', ')}` : `Zmagovalec: ${winners[0]?.nickname}`}</p>
        <p>Tvoj rezultat: <strong>{me?.score} / {room.total}</strong></p>
        <p className="hint">Rezultati te igre se ne shranjujejo na račun.</p>
      </> : <>
        <p className="round-meta">Vprašanje {room.index + 1} od {room.total}<span>{room.status === 'reveal' ? 'Naslednji korak' : 'Preostali čas'}: {seconds} s</span></p>
        <h2 className="question-text">{room.question.text}</h2>
        {room.status === 'question' ? <>
          <form key={room.question.id} onSubmit={event => {
            event.preventDefault()
            send({ type: 'answer', questionId: room.question.id, answer: currentAnswer })
          }}>
            <label>Tvoj odgovor<input name="answer" value={currentAnswer} onChange={event => setAnswer({ questionId: room.question.id, value: event.target.value })} maxLength={500} disabled={disabled || room.submitted} required autoComplete="off" /></label>
            <button className="primary-button" disabled={disabled || room.submitted || !currentAnswer.trim()}>{room.submitted ? 'Odgovor oddan' : 'Oddaj odgovor'}</button>
          </form>
          {room.submitted && <p role="status">Počakaj na ostale igralce ali iztek časa.</p>}
        </> : <div className="feedback" role="status">
          <p><strong>{me?.correct ? 'Pravilno!' : room.submitted ? 'Odgovor ni pravilen.' : 'Čas za odgovor je potekel.'}</strong></p>
          <p>Tvoj odgovor: {room.yourAnswer || 'Brez odgovora'}</p>
          <p>Pravilni odgovor: <strong>{room.correctAnswer}</strong></p>
        </div>}
      </>}
      <h2 className="leaderboard-title">{room.status === 'finished' ? 'Končna lestvica' : 'Igralci in točke'}</h2>
      <ol className="player-list">{leaderboard.map(player => <li key={player.id}>
        <span>{player.nickname}{player.id === room.playerId ? ' (ti)' : ''}{player.left ? ' · zapustil igro' : !player.connected ? ' · brez povezave' : ''}</span>
        <span>{player.score} t.{room.status === 'question' && player.answered ? ' · oddal' : ''}</span>
      </li>)}</ol>
    </>}
  </section>
}
