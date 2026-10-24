'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { getInventory, saveCatch, type InventoryCatch } from './actions'

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
type Screen = 'title' | 'intro' | 'question' | 'evaluating' | 'feedback' | 'reeling' | 'result'

const questionPool = [
  'Name a fish that can survive in water with almost no oxygen.',
  'Name a fish found in the deepest parts of the ocean.',
  'Name a fish with an unusual way of hunting.',
  'Name a fish that can move across land.',
  'Name a fish with a built-in light source.',
  'Name a fish that has barely changed since prehistoric times.',
  'Name a fish known for an unusual defense mechanism.',
  'Name a fish that lives in freezing polar waters.',
  'Name a fish with a surprising parenting strategy.',
  'Name a fish that can change its sex.',
  'Name a fish with an unusually long migration.',
  'Name a fish whose appearance feels almost mythical.',
]

type Target = { name: string; rarity: Rarity; threshold: number }
const targets: Target[] = [
  { name: 'Moon Jelly Goby', rarity: 'common', threshold: 18 },
  { name: 'Bluefin Trevally', rarity: 'rare', threshold: 30 },
  { name: 'Phantom Knifefish', rarity: 'epic', threshold: 44 },
  { name: 'Giant Oarfish', rarity: 'legendary', threshold: 60 },
  { name: 'Golden Mahseer', rarity: 'legendary', threshold: 58 },
]

const scoring: Record<string, { points: number; rarity: Rarity; reaction: string }> = {
  'giant oarfish': { points: 26, rarity: 'legendary', reaction: 'By the seven seas—an answer from the abyss!' },
  coelacanth: { points: 25, rarity: 'legendary', reaction: 'A living fossil! Spectacular knowledge!' },
  'goblin shark': { points: 23, rarity: 'legendary', reaction: 'Deep, strange, and wonderfully obscure!' },
  'angler fish': { points: 17, rarity: 'epic', reaction: 'A glowing choice from the midnight zone!' },
  anglerfish: { points: 17, rarity: 'epic', reaction: 'A glowing choice from the midnight zone!' },
  'mudskipper': { points: 14, rarity: 'epic', reaction: 'A fish that walks—clever indeed!' },
  'arapaima': { points: 11, rarity: 'rare', reaction: 'An air-breathing river giant. Well played!' },
  'lungfish': { points: 10, rarity: 'rare', reaction: 'A fine answer with ancient roots!' },
  'tuna': { points: 5, rarity: 'common', reaction: 'A solid catch, but Neptune has heard it before.' },
  'salmon': { points: 4, rarity: 'common', reaction: 'True enough—though not especially mysterious.' },
}

const rarityLabels: Record<Rarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
}

function RarityTag({ rarity }: { rarity: Rarity }) {
  return <span className={`rarity rarity--${rarity}`}>{rarityLabels[rarity]}</span>
}

function GameButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button className={`button button--${variant}`} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  )
}

function Neptune({ pose = 'asking' }: { pose?: 'greeting' | 'asking' | 'happy' | 'sad' | 'casting' | 'thinking' }) {
  const happy = pose === 'happy'
  const sad = pose === 'sad'
  const casting = pose === 'casting'
  const thinking = pose === 'thinking'
  return (
    <div className={`neptune neptune--${pose}`} aria-label={`King Neptune, ${pose} pose`}>
      {casting && <div className="magic-ring" />}
      {thinking && <span className="thought thought--one">·</span>}
      {thinking && <span className="thought thought--two">?</span>}
      <svg viewBox="0 0 280 390" role="img" aria-hidden="true">
        <path className="cape" d="M71 163C20 208 19 327 45 371h190c23-55 15-146-27-201z" />
        <path className="tail" d="M80 308c-22 32-13 66 9 63 10-2 14-17 22-19 12-4 17 24 38 20 25-5 22-39 41-37 13 1 13 24 29 22 17-2 21-27 8-56z" />
        <path className="arm" d={casting ? 'M79 184C43 163 28 129 45 118c13-8 24 32 58 42' : 'M75 188c-24 10-38 31-26 41 11 9 27-10 44-17'} />
        <path className="arm" d="M205 189c23 5 38 27 27 39-11 11-28-8-42-14" />
        <path className="body" d="M90 165c19-23 80-25 102 2 19 25 24 124-3 160H91c-25-40-20-134-1-162z" />
        <path className="belt" d="M79 269c38 12 82 12 125 0l4 27c-44 13-89 12-133-1z" />
        <path className="hair" d="M89 75c7-51 93-55 105-1 19 7 29 23 24 43-3 14-16 22-23 21-9 43-99 48-112 2-17-1-27-11-26-27 1-19 13-33 32-38z" />
        <ellipse className="face" cx="140" cy="109" rx="54" ry="59" />
        <path className="crown" d="M96 68l8-42 26 22 14-37 17 37 27-22 1 45z" />
        <circle className="crown-gem" cx="143" cy="52" r="8" />
        <path className="brow" d={sad ? 'M108 98l19-5m27 0l19 5' : thinking ? 'M108 91l20 5m26-2l20-7' : 'M108 94h19m28 0h18'} />
        <circle className="eye" cx="119" cy="108" r="5" />
        <circle className="eye" cx="163" cy="108" r="5" />
        <path className="nose" d="M143 109l-4 15 9 2" />
        <path className="mouth" d={happy ? 'M117 135q24 25 48 0' : sad ? 'M119 148q22-19 45 0' : thinking ? 'M127 142q13-5 27 0' : 'M122 139q20 10 40 0'} />
        <path className="beard" d="M89 126c9 9 17 8 25 3 1 25 11 52 27 64 15-14 26-38 27-64 10 7 18 7 26-2 2 43-10 96-52 119-43-24-57-74-53-120z" />
        <path className="trident" d="M239 66v273m-22-256 22-27 22 27m-22-27V30" />
      </svg>
    </div>
  )
}

function Rod({ state = 'idle' }: { state?: 'idle' | 'cast' | 'tension' | 'caught' | 'slack' }) {
  return (
    <div className={`rod rod--${state}`} aria-label={`Fishing rod, ${state}`}>
      <svg viewBox="0 0 300 460" aria-hidden="true">
        <path className="rod-stick" d="M42 426Q99 205 222 79" />
        <path className="rod-line" d="M220 79Q290 146 262 345" />
        <circle className="reel" cx="73" cy="337" r="26" />
        <circle className="reel-inner" cx="73" cy="337" r="10" />
        <path className="handle" d="M54 379l-22 64" />
        <circle className="bobber" cx="262" cy="349" r="7" />
      </svg>
    </div>
  )
}

function ProgressMeter({ points, threshold = 60 }: { points: number; threshold?: number }) {
  const width = Math.min(100, (points / threshold) * 100)
  return (
    <div className="meter-wrap">
      <div className="meter-labels">
        <span>Rod power</span>
        <strong>{points} / {threshold} pts</strong>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={points} aria-valuemax={threshold}>
        <div className="meter-fill" style={{ width: `${width}%` }} />
        <div className="threshold-marker"><span>REEL IN!</span></div>
      </div>
    </div>
  )
}

function Hud({ points, question, target, onInventory, count }: { points: number; question: number; target: Target; onInventory: () => void; count: number }) {
  return (
    <div className="hud">
      <div className="hud-item"><span className="hud-label">QUEST</span><strong>{Math.min(question + 1, 3)} <small>/ 3</small></strong></div>
      <div className="hud-target">
        <span className="hud-label">TARGET</span>
        <strong>{target.name}</strong>
        <RarityTag rarity={target.rarity} />
        <span className="needs">needs {target.threshold} pts</span>
      </div>
      <button className="hud-item hud-score inventory-button" onClick={onInventory}><span className="hud-label">KEEP · {count}</span><strong>{points} <small>PTS</small></strong></button>
    </div>
  )
}

function Dialogue({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="dialogue">
      <span className="dialogue-name">{eyebrow || 'KING NEPTUNE'}</span>
      {children}
    </div>
  )
}

function ScoreBreakdown({ answers }: { answers: Answer[] }) {
  return (
    <div className="score-list">
      {answers.map((answer, index) => (
        <div className="score-row" key={`${answer.name}-${index}`}>
          <span className="row-number">{index + 1}</span>
          <strong>{answer.name}</strong>
          <RarityTag rarity={answer.rarity} />
          <b>+{answer.points}</b>
        </div>
      ))}
    </div>
  )
}

type Answer = { name: string; points: number; rarity: Rarity; reaction: string }

function Inventory({ items, onClose }: { items: InventoryCatch[]; onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="inventory">
        <div className="guide-head">
          <div><span className="kicker">NEPTUNE’S KEEP</span><h2>Caught fish</h2></div>
          <button className="close-button" onClick={onClose} aria-label="Close inventory">×</button>
        </div>
        {items.length ? <div className="inventory-list">{items.map((item) => (
          <div className="inventory-row" key={item.id}>
            <div><strong>{item.fishName}</strong><span>{new Date(item.caughtAt).toLocaleDateString()}</span></div>
            <RarityTag rarity={item.rarity} /><b>{item.points} pts</b>
          </div>
        ))}</div> : <div className="empty-keep"><strong>Your keep is empty</strong><p>Land a target fish and its name will be recorded here.</p></div>}
      </div>
    </div>
  )
}

function classifyAnswer(value: string): Answer {
  const clean = value.trim()
  const found = scoring[clean.toLowerCase()]
  if (found) return { name: clean, ...found }
  const long = clean.length > 11
  return {
    name: clean,
    points: long ? 12 : 6,
    rarity: long ? 'rare' : 'common',
    reaction: long ? 'An intriguing name! The tides approve.' : 'A fair answer—every point helps.',
  }
}

function StyleGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="guide">
        <div className="guide-head">
          <div><span className="kicker">TIDEBRAIN UI KIT</span><h2>Storybook system</h2></div>
          <button className="close-button" onClick={onClose} aria-label="Close style guide">×</button>
        </div>
        <div className="guide-grid">
          <section><h3>Rarity language</h3><div className="tag-stack">{(['common', 'rare', 'epic', 'legendary'] as Rarity[]).map(r => <RarityTag key={r} rarity={r} />)}</div><p>Color, label, border and weight work together—never color alone.</p></section>
          <section><h3>Typography</h3><div className="type-sample">Giant Oarfish</div><p>Fraunces-inspired display serif / friendly humanist sans body.</p></section>
          <section><h3>Controls</h3><div className="button-stack"><GameButton>Primary action</GameButton><GameButton variant="secondary">Secondary</GameButton><GameButton disabled>Disabled</GameButton></div></section>
          <section><h3>Input states</h3><input className="answer-input" placeholder="Default input" /><input className="answer-input is-error" value="" readOnly placeholder="Error / required" /><p>56px controls, 8px spacing rhythm, 16–24px rounded corners.</p></section>
          <section className="swatches"><h3>Core palette</h3><div><i className="swatch sand" />Sunlit sand</div><div><i className="swatch ocean" />Ocean teal</div><div><i className="swatch navy" />Deep navy</div><div><i className="swatch gold" />Neptune gold</div></section>
          <section><h3>Motion</h3><p>Soft bobbing, wave drift, sparkles, and short score bursts. Reduced-motion preferences are respected.</p></section>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [question, setQuestion] = useState(0)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Answer[]>([])
  const [guideOpen, setGuideOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryCatch[]>([])
  const [targetIndex, setTargetIndex] = useState(3)
  const [roundQuestions, setRoundQuestions] = useState(() => questionPool.slice(0, 3))
  const playerToken = useRef('')
  const savedRound = useRef(false)
  const target = targets[targetIndex]
  const latest = answers[answers.length - 1]
  const points = useMemo(() => answers.reduce((sum, item) => sum + item.points, 0), [answers])

  useEffect(() => {
    if (screen !== 'evaluating') return
    const timer = window.setTimeout(() => setScreen('feedback'), 1500)
    return () => window.clearTimeout(timer)
  }, [screen])

  useEffect(() => {
    let token = window.localStorage.getItem('tidebrain-player')
    if (!token) {
      token = crypto.randomUUID()
      window.localStorage.setItem('tidebrain-player', token)
    }
    playerToken.current = token
    getInventory(token).then(setInventory).catch(() => setInventory([]))
  }, [])

  useEffect(() => {
    if (screen !== 'result' || points < target.threshold || savedRound.current || !playerToken.current) return
    savedRound.current = true
    saveCatch({ playerToken: playerToken.current, fishName: target.name, rarity: target.rarity, points, threshold: target.threshold })
      .then((caught) => caught && setInventory((current) => [caught, ...current]))
      .catch(() => { savedRound.current = false })
  }, [screen, points, target])

  const begin = () => {
    setQuestion(0); setAnswers([]); setValue(''); setError(''); savedRound.current = false
    setRoundQuestions([...questionPool].sort(() => Math.random() - .5).slice(0, 3))
    setScreen('intro')
  }

  const retryWithNewTarget = () => {
    setTargetIndex((current) => (current + 1) % targets.length)
    begin()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) {
      setError('The sea is silent—type a fish name first.')
      return
    }
    setAnswers(current => [...current, classifyAnswer(value)])
    setError('')
    setScreen('evaluating')
  }

  const continueFromFeedback = () => setScreen('reeling')
  const continueFromReeling = () => {
    if (question === 2) setScreen('result')
    else {
      setQuestion(current => current + 1)
      setValue('')
      setScreen('question')
    }
  }

  const isGame = !['title', 'intro', 'result'].includes(screen)
  const won = points >= target.threshold
  const pose = screen === 'evaluating' ? 'thinking' : screen === 'feedback' ? (latest?.points >= 15 ? 'happy' : 'asking') : screen === 'reeling' ? (points >= 60 ? 'happy' : 'asking') : 'asking'

  return (
    <main className={`app app--${screen}`}>
      <div className="sky">
        <div className="sun" />
        <div className="cloud cloud--one" />
        <div className="cloud cloud--two" />
        <div className="island island--one" />
        <div className="island island--two" />
      </div>
      <div className="ocean"><div className="wave wave--one" /><div className="wave wave--two" /></div>
      <div className="beach"><div className="shell shell--one">✦</div><div className="shell shell--two">⌁</div></div>

      {screen === 'title' && (
        <div className="title-screen">
          <div className="title-copy">
            <span className="kicker">A TRIVIA FISHING TALE</span>
            <h1>Tide<span>brain</span></h1>
            <p className="title-deck">Cast your knowledge.<br />Catch the impossible.</p>
            <div className="how-to">
              <span>1</span><p><strong>Answer 3 questions</strong><br />with a fish name</p>
              <i />
              <span>2</span><p><strong>Earn rarity points</strong><br />for obscure answers</p>
              <i />
              <span>3</span><p><strong>Beat the threshold</strong><br />and reel it in</p>
            </div>
            <div className="title-actions"><GameButton onClick={begin}>Start fishing <span aria-hidden="true">→</span></GameButton><GameButton variant="secondary" onClick={() => setInventoryOpen(true)}>My keep · {inventory.length}</GameButton><GameButton variant="ghost" onClick={() => setGuideOpen(true)}>View UI kit</GameButton></div>
          </div>
          <Neptune pose="greeting" />
        </div>
      )}

      {screen === 'intro' && (
        <div className="scene scene--intro">
          <div className="teleport-flash"><span>✦</span><span>✦</span><span>✦</span></div>
          <Rod state="cast" />
          <Neptune pose="casting" />
          <Dialogue eyebrow="KING NEPTUNE · RULER OF THE DEEP">
            <h2>Ahoy, bright mind!</h2>
            <p>I’ve sent your rod to a legendary fishing spot. Answer three questions with the most unusual fish you know. Impress me—and the catch is yours!</p>
            <GameButton onClick={() => setScreen('question')}>I’m ready</GameButton>
          </Dialogue>
        </div>
      )}

      {isGame && <Hud points={points} question={question} target={target} onInventory={() => setInventoryOpen(true)} count={inventory.length} />}

      {screen === 'question' && (
        <div className="scene scene--game">
          <Rod state="idle" />
          <Neptune pose="asking" />
          <Dialogue eyebrow={`QUESTION ${question + 1} OF 3`}>
            <h2>{roundQuestions[question]}</h2>
            <form onSubmit={submit}>
              <label htmlFor="fish-answer">Your fish answer</label>
              <div className="input-row">
                <input id="fish-answer" autoFocus className={`answer-input ${error ? 'is-error' : ''}`} value={value} onChange={e => { setValue(e.target.value); setError('') }} placeholder="e.g. Coelacanth" />
                <GameButton type="submit">Submit answer</GameButton>
              </div>
              <div className="input-meta"><span className={error ? 'error-text' : ''}>{error || 'Be specific—obscure answers score more.'}</span><span>{value.length}/40</span></div>
            </form>
          </Dialogue>
        </div>
      )}

      {screen === 'evaluating' && (
        <div className="scene scene--game">
          <Rod state="idle" /><Neptune pose="thinking" />
          <Dialogue eyebrow="THE VERDICT">
            <div className="judging"><div className="orb"><i /><i /><i /></div><div><h2>King Neptune is judging...</h2><p>Searching the deepest corners of the fish database for <strong>“{latest?.name}”</strong></p></div></div>
          </Dialogue>
        </div>
      )}

      {screen === 'feedback' && latest && (
        <div className={`scene scene--game feedback feedback--${latest.rarity}`}>
          <Rod state="idle" /><Neptune pose={latest.points >= 15 ? 'happy' : 'asking'} />
          <Dialogue eyebrow="NEPTUNE’S VERDICT">
            <div className="feedback-line"><div><span className="mini-label">YOUR ANSWER</span><h2 className="fish-name">{latest.name}</h2><RarityTag rarity={latest.rarity} /></div><div className="points-pop">+{latest.points}<small>PTS</small></div></div>
            <p className="reaction">“{latest.reaction}”</p>
            <GameButton onClick={continueFromFeedback}>Add to rod power</GameButton>
          </Dialogue>
        </div>
      )}

      {screen === 'reeling' && (
        <div className="scene scene--game">
          <Rod state={points >= target.threshold ? 'caught' : 'tension'} /><Neptune pose={points >= target.threshold ? 'happy' : 'asking'} />
          <Dialogue eyebrow="LINE TENSION">
            <h2>{question === 2 ? (points >= target.threshold ? 'The line is surging!' : 'One last pull...') : 'Your rod grows stronger!'}</h2>
            <ProgressMeter points={points} threshold={target.threshold} />
            <p>{points >= target.threshold ? `You crossed the ${target.rarity} threshold. Hold tight!` : `${Math.max(0, target.threshold - points)} more points needed to land the ${target.name}.`}</p>
            <GameButton onClick={continueFromReeling}>{question === 2 ? 'Reel it in' : 'Next question'}</GameButton>
          </Dialogue>
        </div>
      )}

      {screen === 'result' && (
        <div className={`result result--${won ? 'catch' : 'miss'}`}>
          <div className="result-card">
            <span className="kicker">{won ? 'LEGENDARY CATCH' : 'SO CLOSE'}</span>
            <h2>{won ? 'You reeled it in!' : 'The fish got away...'}</h2>
            <div className="result-fish">{target.name}</div>
            <RarityTag rarity={target.rarity} />
            <ProgressMeter points={points} threshold={target.threshold} />
            <ScoreBreakdown answers={answers} />
            <p className="result-note">{won ? `Added to your keep with a brilliant ${points}-point catch.` : `You earned ${points} of ${target.threshold} points. Neptune has moved your rod to a new target.`}</p>
            <div className="result-actions"><GameButton onClick={won ? begin : retryWithNewTarget}>{won ? 'Fish again' : 'Find a new target'}</GameButton><GameButton variant="secondary" onClick={() => setInventoryOpen(true)}>View keep</GameButton></div>
          </div>
          <Neptune pose={won ? 'happy' : 'sad'} />
          <Rod state={won ? 'caught' : 'slack'} />
        </div>
      )}

      <div className="sound-pill" aria-label="Sound on">♪ <span>Sound on</span></div>
      {guideOpen && <StyleGuide onClose={() => setGuideOpen(false)} />}
      {inventoryOpen && <Inventory items={inventory} onClose={() => setInventoryOpen(false)} />}
    </main>
  )
}
