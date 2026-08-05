function Header({ soundEnabled, onToggleSound, right }) {
  return (
    <header>
      <div className="brand">
        <div className="brand-icon">
          <span className="cube cube-yellow"></span>
          <span className="cube cube-blue"></span>
          <span className="cube cube-red"></span>
        </div>
        <div className="brand-text">
          <h1>Topo Oefenen</h1>
        </div>
      </div>
      {right}
      <button className="menu-btn" onClick={onToggleSound} title="Geluid aan/uit">
        {soundEnabled ? '🔊' : '🔇'}
      </button>
    </header>
  )
}

export default Header
