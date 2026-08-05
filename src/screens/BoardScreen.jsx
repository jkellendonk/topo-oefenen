import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { fmtTime, directionLabel } from '../utils.js'
import { getScores } from '../api.js'

function computeDeltas(scores) {
  const byKey = {}
  return [...scores]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((r) => {
      const key = `${r.packId}|${r.direction}`
      const prev = byKey[key]
      const deltaAcc = prev ? r.accuracy - prev.accuracy : null
      const deltaTime = prev ? prev.timeSeconds - r.timeSeconds : null
      byKey[key] = r
      return { ...r, deltaAcc, deltaTime }
    })
}

function BoardScreen({ sound, onBack }) {
  const [scores, setScores] = useState([])

  useEffect(() => {
    getScores().then(setScores)
  }, [])

  const header = (
    <Header
      soundEnabled={sound.enabled}
      onToggleSound={sound.toggle}
      right={
        <button className="menu-btn" onClick={onBack}>
          🏠 Hoofdmenu
        </button>
      }
    />
  )

  if (scores.length === 0) {
    return (
      <>
        {header}
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>🏆 Scorebord</h2>
          <p className="sub">Hier komt de voortgang te staan zodra er een kaart is afgerond.</p>
          <button className="start-btn" onClick={onBack}>
            Terug naar start
          </button>
        </div>
      </>
    )
  }

  const byName = {}
  scores.forEach((r) => {
    if (!byName[r.playerName]) byName[r.playerName] = []
    byName[r.playerName].push(r)
  })

  return (
    <>
      {header}
      <div className="panel">
        <h2>🏆 Scorebord</h2>
        <p className="sub">
          Groene pijl = vooruitgang t.o.v. de vorige poging op dezelfde kaart en richting. Rood
          betekent: nog even oefenen.
        </p>
        {Object.entries(byName).map(([name, list]) => {
          const rows = computeDeltas(list).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
          return (
            <div className="board" style={{ marginBottom: 16 }} key={name}>
              <div className="board-title">👤 {name}</div>
              {rows.map((r) => (
                <div className="board-row" key={r.id}>
                  <div className="board-name">
                    {r.pack.title} <span className="dim">{directionLabel(r.direction)}</span>
                  </div>
                  <div className="board-stat">
                    {r.accuracy}% &middot; {fmtTime(r.timeSeconds)}
                  </div>
                  <div className="board-delta">
                    {r.deltaAcc === null ? (
                      <span className="dim">eerste poging</span>
                    ) : (
                      <span
                        style={{
                          color:
                            r.deltaAcc === 0 ? '#8A97A8' : r.deltaAcc > 0 ? 'var(--mint)' : 'var(--coral)',
                        }}
                      >
                        {r.deltaAcc === 0 ? '▬' : r.deltaAcc > 0 ? '▲' : '▼'} {Math.abs(r.deltaAcc)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        <button className="ghost-btn" style={{ width: '100%' }} onClick={onBack}>
          Terug naar hoofdmenu
        </button>
      </div>
    </>
  )
}

export default BoardScreen
