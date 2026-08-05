import { useEffect, useState } from 'react'
import { useSound } from './hooks/useSound.js'
import { getPack } from './api.js'
import { loadQuizSession, clearQuizSession } from './sessionStore.js'
import StartScreen from './screens/StartScreen.jsx'
import QuizScreen from './screens/QuizScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import BoardScreen from './screens/BoardScreen.jsx'

function isResumableSession(session, fullPack) {
  if (!session?.quizState?.queue || !fullPack) return false
  const validIds = new Set(fullPack.questions.map((q) => q.id))
  return session.quizState.queue.every((id) => validIds.has(id))
}

function App() {
  const sound = useSound()
  const [screen, setScreen] = useState('start')
  const [playerName, setPlayerName] = useState('')
  const [activePlayerName, setActivePlayerName] = useState('Speler')
  const [direction, setDirection] = useState('code-name')
  const [packId, setPackId] = useState(null)
  const [pack, setPack] = useState(null)
  const [result, setResult] = useState(null)
  const [resumeSession, setResumeSession] = useState(null)

  useEffect(() => {
    const session = loadQuizSession()
    if (!session) return
    getPack(session.packId).then((fullPack) => {
      if (!isResumableSession(session, fullPack)) {
        clearQuizSession()
        return
      }
      setPlayerName(session.playerName)
      setActivePlayerName(session.playerName)
      setDirection(session.direction)
      setPackId(session.packId)
      setPack(fullPack)
      setResumeSession(session)
      setScreen('quiz')
    })
  }, [])

  const startQuiz = async () => {
    const fullPack = await getPack(packId)
    setActivePlayerName(playerName.trim() || 'Speler')
    setPack(fullPack)
    setResult(null)
    setResumeSession(null)
    setScreen('quiz')
  }

  return (
    <div className={`app ${screen === 'quiz' ? 'app-wide' : ''}`}>
      {screen === 'start' && (
        <StartScreen
          sound={sound}
          playerName={playerName}
          setPlayerName={setPlayerName}
          direction={direction}
          setDirection={setDirection}
          packId={packId}
          setPackId={setPackId}
          onStart={startQuiz}
          onOpenBoard={() => setScreen('board')}
        />
      )}

      {screen === 'quiz' && pack && (
        <QuizScreen
          key={`${pack.id}-${direction}`}
          pack={pack}
          direction={direction}
          playerName={activePlayerName}
          sound={sound}
          resumeSession={resumeSession}
          onFinish={(r) => {
            setResumeSession(null)
            setResult(r)
            setScreen('result')
          }}
          onBackToMenu={() => {
            setResumeSession(null)
            setScreen('start')
          }}
        />
      )}

      {screen === 'result' && pack && result && (
        <ResultScreen
          pack={pack}
          direction={direction}
          playerName={activePlayerName}
          result={result}
          sound={sound}
          onPlayAgain={startQuiz}
          onChangePack={() => setScreen('start')}
          onOpenBoard={() => setScreen('board')}
        />
      )}

      {screen === 'board' && <BoardScreen sound={sound} onBack={() => setScreen('start')} />}
    </div>
  )
}

export default App
