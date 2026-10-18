import { useState } from 'react'
import { Quiz } from './DailyQuiz'

const subjects = { math: 'Matematika', history: 'Zgodovina' }

export default function Klasicno({ student, onBack }) {
  const [selection, setSelection] = useState(null)
  const [page, setPage] = useState(1)
  if (selection) return <Quiz
    key={`${selection.grade}-${selection.subject}-${page}`}
    title="Klasično"
    subtitle={`${selection.grade}. razred · ${subjects[selection.subject]} · Sklop ${page}`}
    grade={selection.grade}
    guest={!student}
    path={`questions/klasicno?grade=${selection.grade}&subject=${selection.subject}&page=${page}`}
    onNext={() => setPage(page + 1)}
    onBack={() => { setSelection(null); setPage(1) }}
  />
  return <section className="quiz-panel">
    <button className="text-button back-button" onClick={onBack}>← Nazaj na glavno stran</button>
    <h1>Klasično</h1>
    <p className="intro">Izberi razred in predmet. Vprašanja rešuješ v sklopih po 10</p>
    <form onSubmit={event => {
      event.preventDefault()
      setSelection(Object.fromEntries(new FormData(event.currentTarget)))
    }}>
      <label>Razred<select name="grade" defaultValue={student?.grade || ''} required>
        <option value="" disabled>Izberi razred</option>
        {[7, 8, 9].map(grade => <option key={grade} value={grade}>{grade}. razred</option>)}
      </select></label>
      <label>Predmet<select name="subject" defaultValue="" required>
        <option value="" disabled>Izberi predmet</option>
        {Object.entries(subjects).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button className="primary-button">Začni prvi sklop</button>
    </form>
  </section>
}
