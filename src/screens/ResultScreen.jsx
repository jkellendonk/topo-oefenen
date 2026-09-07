import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import { fmtTime, isTypedMode } from '../utils.js'
import { getScores, postScore } from '../api.js'

function ResultScreen({ pack, direction, playerName, result, sound, onPlayAgain, onChangePack, onOpenBoard }) {
  const [isRecord, setIsRecord] = useState(false)
  const [top5, setTop5] = useState([])
  const postedRef = useRef(false)

  useEffect(() => {
    if (postedRef.current) return
    postedRef.current = true
    ;(async () => {
      const priorScores = await getScores()
      const priorBest = priorScores
        .filter(
          (s) => s.playerName === playerName && s.packId === pack.id && s.direction === direction
        )
        .sort((a, b) => b.accuracy - a.accuracy || a.timeSeconds - b.timeSeconds)[0]
      const record =
        !priorBest ||
        result.accuracy > priorBest.accuracy ||
        (result.accuracy === priorBest.accuracy && result.timeSeconds < priorBest.timeSeconds)
      setIsRecord(record)

      // `missed` is only for the on-screen review below; keep stored score records lean.
      const { missed: _missed, ...scoreFields } = result
      await postScore({ playerName, packId: pack.id, direction, ...scoreFields })

      const allScores = await getScores()
      setTop5(
        [...allScores]
          .sort((a, b) => b.accuracy - a.accuracy || a.timeSeconds - b.timeSeconds)
          .slice(0, 5)
      )
    })()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') onPlayAgain()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onPlayAgain])

  const praise =
    result.accuracy === 100
      ? 'Foutloos! Alles in één keer goed. 🎉'
      : result.stars === 3
        ? 'Fantastisch werk! Bijna alles in één keer goed.'
        : result.stars === 2
          ? 'Goed bezig! Nog een paar keer oefenen en het zit er helemaal in.'
          : 'Mooie eerste ronde! Elke keer oefenen maakt je sneller.'

  return (
    <>
      <Header
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
        right={<div className="player-badge">👤 {playerName}</div>}
      />

      <div className="panel">
        <div className="result-hero">
          <div className="stars">
            {'⭐'.repeat(result.stars)}
            {'☆'.repeat(3 - result.stars)}
          </div>
          <div className="result-title">Kaart "{pack.title}" voltooid!</div>
          {isTypedMode(direction) && <span className="toets-pill">📝 TOETS</span>}
          <div className="result-sub">{praise}</div>
        </div>

        {isRecord && <div className="record-banner">🏆 Nieuw persoonlijk record voor deze kaart!</div>}

        <div className="metric-grid">
          <div className="metric">
            <div className="mval">{result.accuracy}%</div>
            <div className="mlabel">Nauwkeurigheid</div>
          </div>
          <div className="metric">
            <div className="mval">{fmtTime(result.timeSeconds)}</div>
            <div className="mlabel">Tijd nodig</div>
          </div>
          <div className="metric">
            <div className="mval">{result.mistakes}</div>
            <div className="mlabel">Foutjes totaal</div>
          </div>
          <div className="metric">
            <div className="mval">🔥 {result.bestStreak}</div>
            <div className="mlabel">Langste reeks</div>
          </div>
        </div>

        {result.missed && result.missed.length > 0 && (
          <div className="board" style={{ marginBottom: 20 }}>
            <div className="board-title">🔍 Nog even oefenen</div>
            {result.missed.map((m, i) => (
              <div className="board-row" key={i}>
                <div className="board-name">{m.place}</div>
                <div className="board-stat">{m.answer}</div>
              </div>
            ))}
          </div>
        )}

        <div className="board">
          <div className="board-title">🏅 Beste rondes</div>
          {top5.map((row, i) => (
            <div className="board-row" key={row.id}>
              <div className="board-rank">{i + 1}.</div>
              <div className="board-name">
                {row.playerName}{' '}
                <span style={{ color: '#B8C7BF', fontWeight: 600 }}>&middot; {row.pack.title}</span>
              </div>
              <div className="board-stat">
                {row.accuracy}% &middot; {fmtTime(row.timeSeconds)}
              </div>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="ghost-btn" onClick={onChangePack}>
            Andere kaart
          </button>
          <button className="start-btn" onClick={onPlayAgain}>
            Nog een keer ➜
          </button>
        </div>
        <button className="ghost-btn" style={{ width: '100%', marginTop: 12 }} onClick={onOpenBoard}>
          🏆 Volledig scorebord
        </button>
      </div>
    </>
  )
}

export default ResultScreen
