import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { getPacks, GROUPS } from '../api.js'

function StartScreen({
  sound,
  playerName,
  setPlayerName,
  group,
  setGroup,
  direction,
  setDirection,
  packId,
  setPackId,
  onStart,
  onOpenBoard,
}) {
  const [packs, setPacks] = useState([])

  useEffect(() => {
    setPackId(null)
    getPacks(group).then((data) => {
      setPacks(data)
      if (data.length > 0) setPackId(data[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (packId) onStart()
  }

  return (
    <>
      <Header soundEnabled={sound.enabled} onToggleSound={sound.toggle} />
      <div className="panel">
        <h2>Wie gaat er oefenen?</h2>
        <p className="sub">Vul je naam in, kies een groep, een kaart en een oefenvorm om te starten</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="nameInput">Naam</label>
          <input
            id="nameInput"
            type="text"
            placeholder="Bijv. Sam"
            autoComplete="off"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <label>Groep</label>
          <div className="dir-toggle">
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`dir-btn ${group === g ? 'active' : ''}`}
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <label>Kies een kaart</label>
          {packs.length === 0 ? (
            <p className="sub">Nog geen kaarten voor {group}. Kies een andere groep.</p>
          ) : (
            <div className="pack-grid">
              {packs.map((p) => (
                <div
                  key={p.id}
                  className={`pack-card ${p.id === packId ? 'active' : ''}`}
                  onClick={() => setPackId(p.id)}
                >
                  <div className="pname">{p.title}</div>
                  <div className="pcount">{p.count} items</div>
                </div>
              ))}
            </div>
          )}

          <label>Oefenvorm</label>
          <div className="dir-toggle">
            <button
              type="button"
              className={`dir-btn ${direction === 'code-name' ? 'active' : ''}`}
              onClick={() => setDirection('code-name')}
            >
              Cijfer/letter ➜ Naam
            </button>
            <button
              type="button"
              className={`dir-btn ${direction === 'name-code' ? 'active' : ''}`}
              onClick={() => setDirection('name-code')}
            >
              Naam ➜ Cijfer/letter
            </button>
          </div>

          <button
            type="button"
            className={`toets-btn ${direction === 'toets' ? 'active' : ''}`}
            onClick={() => setDirection('toets')}
          >
            <span className="toets-pill">TOETS</span>
            <span>Zelf typen — geen meerkeuze, net als op papier</span>
          </button>
          {direction === 'toets' && (
            <p className="sub toets-hint">
              Bijvoorbeeld: <b>Waar ligt Duitsland?</b> → jij typt <b>14</b>.
            </p>
          )}

          <button type="submit" className="start-btn" disabled={!packId}>
            Start! ➜
          </button>
        </form>
        <button
          className="ghost-btn"
          style={{ width: '100%', marginTop: 12 }}
          onClick={onOpenBoard}
        >
          🏆 Bekijk scorebord
        </button>
      </div>
    </>
  )
}

export default StartScreen
