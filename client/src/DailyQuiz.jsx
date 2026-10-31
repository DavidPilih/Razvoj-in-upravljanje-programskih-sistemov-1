import { useEffect, useRef, useState } from 'react'
import DragonHoard from './DragonHoard'

async function api(path, body, signal) {
  const response = await fetch(`/api/${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'include', signal,
    headers: { 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error || 'Zahteva ni uspela.')
  return data
}

export default function DailyQuiz({ student, onBack }) {
  const [guestGrade, setGuestGrade] = useState('')
  if (!student && !guestGrade) return (
    <section className="quiz-panel">
      <button className="text-button back-button" onClick={onBack}>← Nazaj na izbiro</button>
      <h1>Dnevni lov</h1>
      <p className="intro">Igraš kot gost. Rezultat se ne shrani in točke se ne prištejejo računu.</p>
      <form onSubmit={event => {
        event.preventDefault()
        setGuestGrade(new FormData(event.currentTarget).get('grade'))
      }}>
        <label>Razred<select name="grade" defaultValue="" required>
          <option value="" disabled>Izberi razred</option>
          {[7, 8, 9].map(grade => <option key={grade} value={grade}>{grade}. razred</option>)}
        </select></label>
        <button className="primary-button">Začni kviz</button>
      </form>
    </section>
  )
  return <Quiz key={`${student?._id || 'guest'}-${student?.grade || guestGrade}`} grade={student?.grade || guestGrade} guest={!student} onBack={onBack} treasure />
}

// Multiple choice for questions with long answers. `correct` is set once the answer is revealed.
export function Choices({ choices, picked, correct, disabled, onPick }) {
  const state = choice => correct !== undefined
    ? (choice === correct ? ' is-correct' : choice === picked ? ' is-wrong' : '')
    : choice === picked ? ' is-picked' : ''
  return <div className="answer-choices" role="group" aria-label="Možni odgovori">
    {choices.map((choice, position) => <button key={choice} type="button" className={`answer-choice${state(choice)}`} aria-pressed={choice === picked} disabled={disabled} onClick={() => onPick(choice)}>
      <span className="answer-letter" aria-hidden="true">{'ABCD'[position]}</span>{choice}
    </button>)}
  </div>
}

export function Quiz({ grade, guest, onBack, path, title = 'Daily', onNext, subtitle, treasure }) {
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const sceneRef = useRef(null)
  const feedback = answers[index]
  const question = questions[index]
  const finished = questions.length > 0 && index === questions.length

  useEffect(() => {
    const controller = new AbortController()
    api(path || `daily/quiz?grade=${encodeURIComponent(grade)}`, undefined, controller.signal)
      .then(data => { setQuestions(data.questions); setHasNext(Boolean(data.hasNext)) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || 'Povezava s strežnikom ni uspela.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt, grade, path])

  useEffect(() => {
    if (answers.length) sceneRef.current?.scrollIntoView({ block: 'nearest' })
  }, [answers.length])

  async function check(value) {
    if (busy || feedback || !value.trim()) return
    setAnswer(value)
    setBusy(true)
    setError('')
    try {
      const result = await api(`questions/${question._id}/checkAnswer`, { answer: value.trim() })
      if (typeof result?.correct !== 'boolean') {
        throw new Error('Odgovora ni bilo mogoče preveriti.')
      }
      setAnswers(previous => [...previous, { correct: result.correct, answer: value.trim(), correctAnswer: result.correctAnswer }])
    } catch (err) { setError(err.message || 'Povezava s strežnikom ni uspela.') }
    finally { setBusy(false) }
  }

  return (
    <section className="quiz-panel">
      <button className="text-button back-button" disabled={busy} onClick={onBack}>← Nazaj na izbiro</button>
      <h1>{title}</h1>
      {subtitle && <p className="intro">{subtitle}</p>}
      {guest && <p className="intro">Igraš kot gost. Točke se ne shranjujejo.</p>}
      {treasure && questions.length > 0 && <div ref={sceneRef}><DragonHoard answers={answers} total={questions.length} feedback={feedback} finished={finished} /></div>}
      {loading ? <p role="status">Nalaganje vprašanj …</p> : finished ? <>
        <h2>Kviz je zaključen.</h2>
        <p className="intro">Pravilni odgovori: <strong>{answers.filter(item => item.correct).length} / {questions.length}</strong></p>
        <ol className="results">{questions.map((item, position) => <li key={item._id}>
          <p>{item.text}</p>
          <span>Tvoj odgovor: {answers[position].answer} — <strong>{answers[position].correct ? 'Pravilno' : 'Napačno'}</strong></span>
          {!answers[position].correct && answers[position].correctAnswer && <span>Pravilni odgovor: <strong>{answers[position].correctAnswer}</strong></span>}
        </li>)}</ol>
        {onNext && (hasNext ? <button className="primary-button" onClick={onNext}>Naslednji sklop (10 vprašanj)</button> : <p role="status">Rešil si vse sklope za izbrani razred in predmet.</p>)}
        <button className="text-button" onClick={onBack}>Nazaj na izbiro</button>
      </> : question ? <>
        <p className="intro">Vprašanje {index + 1} od {questions.length} · {question.subject === 'math' ? 'Matematika' : 'Zgodovina'}</p>
        <progress value={index + (feedback ? 1 : 0)} max={questions.length} aria-label="Napredek kviza" />
        <h2 className="question-text">{question.text}</h2>
        {question.choices ? <Choices choices={question.choices} picked={answer} correct={feedback?.correctAnswer} disabled={busy || Boolean(feedback)} onPick={check} /> : <form onSubmit={event => { event.preventDefault(); check(answer) }}>
          <label>Tvoj odgovor<input key={question._id} name="answer" value={answer} onChange={event => setAnswer(event.target.value)} disabled={busy || Boolean(feedback)} autoComplete="off" required /></label>
          {!feedback && <button className="primary-button" disabled={busy || !answer.trim()}>{busy ? 'Preverjanje …' : 'Preveri odgovor'}</button>}
        </form>}
        {feedback && <div className="feedback">
          <p role="status"><strong>{feedback.correct ? 'Pravilno!' : 'Odgovor ni pravilen.'}</strong></p>
          {!feedback.correct && feedback.correctAnswer && <p>Pravilni odgovor: <strong>{feedback.correctAnswer}</strong></p>}
          <button className="primary-button" onClick={() => { setIndex(index + 1); setAnswer(''); setError('') }}>{index === questions.length - 1 ? 'Poglej rezultat' : 'Naslednje vprašanje'}</button>
        </div>}
      </> : null}
      {error && <p className="notice" role="alert">{error}</p>}
      {!loading && !questions.length && <button className="primary-button" onClick={() => { setError(''); setLoading(true); setAttempt(attempt + 1) }}>Poskusi znova</button>}
    </section>
  )
}
