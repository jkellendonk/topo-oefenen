import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { getPacks } from '../api.js'

function StartScreen({
  sound,
  playerName,
  setPlayerName,
  direction,
  setDirection,
  packId,
  setPackId,
  onStart,
  onOpenBoard,
}) {
  const [packs, setPacks] = useState([])

  useEffect(() => {
    getPacks().then((data) => {
      setPacks(data)
      if (data.length > 0 && !packId) setPackId(data[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (packId) onStart()
  }

  return (
    <>
      <Header soundEnabled={sound.enabled} onToggleSound={sound.toggle} />
      <div className="panel">
        <h2>Wie gaat er oefenen?</h2>
        <p className="sub">Vul je naam in, kies een kaart en een richting om te starten</p>
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

          <label>Kies een kaart</label>
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

          <label>Richting</label>
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
