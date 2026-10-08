'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronRight, Clock3, Eraser, Home, Lightbulb, MoreHorizontal, Pause, PenLine, RotateCcw, Settings, Sparkles, Trophy } from 'lucide-react';
import { SessionBusy } from '../src/session';
import { useContext, useRef } from 'react';
import { flyNumber } from '../src/lib/numberFlight';
import { applyNumber, emptyNotes, flushPlaySaves, localDay, playRequest, queueSave, streaks, type Level, type PlayGame } from '../src/lib/play';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2,'0')}:${(seconds % 60).toString().padStart(2,'0')}`;
const levels: Level[] = ['easy', 'medium', 'hard'];

export default function HomePage() {
  const sessionBusy = useContext(SessionBusy);
  const [game, setGame] = useState<PlayGame | null>(null);
  const [saved, setSaved] = useState<PlayGame[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');
  const [notesMode, setNotesMode] = useState(false);
  const [showNewGame, setShowNewGame] = useState(true);
  const [saveStatus, setSaveStatus] = useState('Saved to your account');
  const dirty = useRef(false);
  const currentGame = useRef(game);
  const boardElement = useRef<HTMLDivElement>(null);
  const stopFlight = useRef<(() => void) | null>(null);
  useEffect(() => () => stopFlight.current?.(), []);
  useEffect(() => {
    stopFlight.current?.();
    stopFlight.current = null;
  }, [game?.id, paused, showNewGame, sessionBusy]);
  currentGame.current = game;
  const puzzle = game?.puzzle || [], solution = game?.solution || [], board = game?.board || [];
  const difficulty = game?.difficulty || 'medium';
  const seconds = game?.seconds || 0, mistakes = game?.mistakes || 0, hintsUsed = game?.hintsUsed || 0;
  const completed = game?.completed || false, lost = mistakes >= 3;
  const blocked = !game || paused || completed || lost || showNewGame || busy || sessionBusy;
  const { current: dailyStreak, best: bestStreak } = streaks(activity, localDay());

  useEffect(() => {
    let active = true;
    playRequest().then((data) => { if (active) { setSaved(data.games); setActivity(data.activity); } })
      .catch((error: Error) => { if (active) setNotice(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (blocked) return;
    const timer = window.setInterval(() => {
      dirty.current = true;
      setGame((value) => value ? { ...value, seconds: value.seconds + 1 } : value);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [blocked]);

  useEffect(() => {
    if (!game || !dirty.current) return;
    dirty.current = false;
    queueSave(game, setSaveStatus);
  }, [game]);

  function update(next: PlayGame) {
    dirty.current = true;
    currentGame.current = next;
    setGame(next);
    // Queue immediately so logout and navigation can always flush the latest move.
    queueSave(next, setSaveStatus);
    dirty.current = false;
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || blocked) return;
      if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); clearCell(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const selectedValue = board[selected[0]]?.[selected[1]];
  const filled = board.flat().filter(Boolean).length;
  const progress = useMemo(() => Math.round((filled / 81) * 100), [filled]);

  function enterNumber(value: number, source?: HTMLButtonElement) {
    const active = currentGame.current;
    if (blocked || !active || active.mistakes >= 3 || active.completed) return;
    const [row, col] = selected;
    if (puzzle[row][col]) return setNotice('This number is part of the original puzzle.');
    const next = applyNumber(active, row, col, value, notesMode);
    update(next);
    if (notesMode) return setNotice(board[row][col] ? 'Erase the answer before adding notes.' : 'Note updated — notes do not count as answers or mistakes.');
    if (value !== solution[row][col]) return setNotice(`${value} is not the correct answer for this cell.`);
    const target = boardElement.current?.children[row * 9 + col];
    if (source && target instanceof HTMLElement && active.board[row][col] !== value) {
      stopFlight.current?.();
      stopFlight.current = flyNumber(source, target, value);
    }
    setNotice('Great move — everything checks out.');
  }

  function clearCell() {
    const active = currentGame.current;
    if (blocked || !active) return;
    const [row, col] = selected;
    if (puzzle[row][col]) return;
    const notes = structuredClone(active.notes); notes[row][col] = [];
    update({ ...active, notes, board: notesMode ? active.board : active.board.map((line, r) => line.map((cell, c) => r === row && c === col ? 0 : cell)) });
  }

  function hint() {
    const active = currentGame.current;
    if (blocked || !active) return;
    if (hintsUsed >= 3) return setNotice('You have used all three hints for this game.');
    const empty = board.flatMap((row, r) => row.map((cell, c) => ({ cell, r, c }))).find(({ cell }) => !cell);
    if (!empty) return;
    const next = board.map((line, r) => line.map((cell, c) => r === empty.r && c === empty.c ? solution[r][c] : cell));
    const notes = structuredClone(active.notes); notes[empty.r][empty.c] = [];
    setSelected([empty.r, empty.c]);
    update({ ...active, board: next, notes, hintsUsed: hintsUsed + 1, completed: next.every((line, r) => line.every((cell, c) => cell === solution[r][c])) });
    setNotice('Hint revealed — look for the pattern around it.');
  }

  async function startGame(level: Level, reset = false) {
    setBusy(true); setNotice('');
    try {
      await flushPlaySaves();
      const data = await playRequest(`/${level}`, 'POST', { reset, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setGame({ ...data.game, notes: data.game.notes || emptyNotes() }); currentGame.current = data.game;
      setSaved((games) => [...games.filter((item) => item.difficulty !== level), data.game]);
      setActivity(data.activity); setPaused(false); setNotesMode(false); setSelected([0,0]); setShowNewGame(false);
      setSaveStatus('Saved to your account');
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }

  async function backToLevels() {
    setBusy(true);
    try {
      await flushPlaySaves();
      if (game) setSaved((games) => [...games.filter((item) => item.difficulty !== difficulty), game]);
      setShowNewGame(true);
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Nudoku home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span>NUDOKU</span></a>
        <div className="topbar-center"><span className="difficulty-dot"/><span>{difficulty}</span><span className="divider"/><span className="timer"><Clock3 size={16}/> {formatTime(seconds)}</span></div>
        <div className="topbar-actions"><button className="icon-button" aria-label="More options"><MoreHorizontal/></button><button className="avatar" aria-label="Open profile">NS</button></div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav aria-label="Primary navigation">
            <a className="nav-item active" href="#game"><span><Home size={18}/> Play</span><span className="nav-pill">IN GAME</span></a>
            <a className="nav-item" href="#stats"><span><BarChart3 size={18}/> Statistics</span></a>
            <a className="nav-item" href="#achievements"><span><Trophy size={18}/> Achievements</span></a>
          </nav>
          <div className="daily-card">
            <div className="streak-orbit"><Sparkles size={18}/><strong>{dailyStreak}</strong></div><p className="eyebrow">DAILY STREAK</p><h3>{dailyStreak} {dailyStreak === 1 ? 'day' : 'days'} of play.</h3><p>Come back tomorrow to keep the rhythm alive.</p>
            <p>Your streak grows when you play on consecutive days.</p>
          </div>
          <button className="settings"><Settings size={18}/> Settings</button>
        </aside>

        <section className="game-area" id="game">
          <div className="game-heading"><div><p className="eyebrow">{difficulty.toUpperCase()} PUZZLE</p><h1>Find your focus.</h1></div><div className="progress-copy"><span>{progress}% COMPLETE</span><span>{filled} / 81 CELLS</span></div></div>
          <div className="progress-track"><span style={{width: `${progress}%`}}/></div>
          <div className="game-card">
            <div className="board-wrap">
              <div ref={boardElement} className="sudoku-board" role="grid" aria-label="9 by 9 Sudoku board">
                {board.map((row,r) => row.map((value,c) => {
                  const [activeRow, activeCol] = selected;
                  const sameBox = Math.floor(r/3) === Math.floor(activeRow/3) && Math.floor(c/3) === Math.floor(activeCol/3);
                  const related = r === activeRow || c === activeCol || sameBox;
                  const sameNumber = value !== 0 && value === selectedValue;
                  const isSelected = r === activeRow && c === activeCol;
                  return <button key={`${r}-${c}`} className={`cell ${related?'related':''} ${sameNumber?'same-number':''} ${isSelected?'selected':''} ${puzzle[r][c]?'given':''}`} disabled={blocked} onClick={() => setSelected([r,c])} role="gridcell" aria-label={`Row ${r+1}, Column ${c+1}, ${value || 'empty'}`}>{value ? <span className="cell-value">{value}</span> : <span className="cell-notes" aria-label={`Notes: ${game?.notes[r][c].join(', ') || 'none'}`}>{[1,2,3,4,5,6,7,8,9].map((number) => <span key={number}>{game?.notes[r][c].includes(number) ? number : ''}</span>)}</span>}</button>;
                }))}
              </div>
              {paused && <div className="pause-cover"><Pause size={28}/><h2>Game paused</h2><p>Your board and timer are safe.</p><button onClick={() => setPaused(false)}>Continue game</button></div>}
            </div>
            <div className="control-panel">
              <div className="status-row"><span><i className="status-dot"/> {saveStatus}</span><span className={mistakes ? 'mistake-count has-mistakes':'mistake-count'}>{mistakes} / 3 mistakes</span></div>
              <div className="number-pad" aria-label="Number pad">{[1,2,3,4,5,6,7,8,9].map((number) => <button key={number} disabled={blocked} onClick={(event) => enterNumber(number, event.currentTarget)} aria-label={`Enter ${number}`}>{number}</button>)}</div>
              <div className="tool-row"><button disabled={blocked} onClick={clearCell}><Eraser size={19}/><span>Erase</span></button><button disabled={blocked} aria-pressed={notesMode} onClick={() => setNotesMode((value) => !value)} className={notesMode?'tool-active':''}><PenLine size={19}/><span>Notes {notesMode?'on':''}</span></button><button disabled={blocked} onClick={hint}><Lightbulb size={19}/><span>Hint</span><small>{3-hintsUsed}</small></button></div>
              <button className="pause-button" disabled={blocked} onClick={() => setPaused(true)}><Pause size={17}/> Pause game</button><p className="keyboard-tip"><kbd>1–9</kbd> to enter <span>·</span> <kbd>⌫</kbd> to erase</p>
            </div>
          </div>
          <div className="message-line" aria-live="polite">{notice || 'Select a cell, then choose a number.'}</div>
        </section>

        <aside className="insight-panel">
          <section><div className="panel-title"><span><Sparkles size={17}/> TODAY&apos;S INSIGHT</span><span>01</span></div><div className="insight-graphic" aria-hidden="true">{[6,8,7,4,1,5,2,3,9].map((number,index) => <span key={index} className={index===4?'focus':''}>{number}</span>)}</div><p className="eyebrow">THE ONE-PLACE RULE</p><h2>One number. One home.</h2><p className="muted-copy">When a number can only fit in one cell within a row, column, or block — that&apos;s its home.</p><button className="learn-more">Learn the technique <ChevronRight size={16}/></button></section>
          <section className="session-card" id="stats"><p className="eyebrow">THIS SESSION</p><div><span>Cells placed</span><strong>{Math.max(0,filled-puzzle.flat().filter(Boolean).length)}</strong></div><div><span>Daily streak</span><strong>{dailyStreak}</strong></div><div><span>Best daily streak</span><strong>{bestStreak}</strong></div><p>Play tomorrow to continue your streak.</p></section>
          <button className="new-game" disabled={busy} onClick={backToLevels}><Home size={16}/> Choose difficulty</button><button className="new-game" disabled={busy || !game} onClick={() => { if (window.confirm('Reset this difficulty? Your current puzzle and progress will be replaced.')) void startGame(difficulty, true); }}><RotateCcw size={16}/> Reset this puzzle</button>
        </aside>
      </div>
      {showNewGame && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-game-title"><div className="modal-card"><p className="eyebrow">PLAY SUDOKU</p><h2 id="new-game-title">Choose your difficulty.</h2><p>Each difficulty has its own saved puzzle. Hard uses expert-level puzzles.</p><div className="difficulty-grid">{levels.map((level) => {
        const previous = saved.find((item) => item.difficulty === level);
        return <button key={level} disabled={busy || loading} onClick={() => startGame(level)}><strong>{level}</strong><span>{previous && !previous.completed ? previous.mistakes >= 3 ? 'Lost — retry or choose another level' : 'Continue saved puzzle' : 'Start new puzzle'}</span></button>;
      })}</div>{loading && <p role="status">Loading your saved games…</p>}{notice && <p role="alert">{notice}</p>}{game && <button className="modal-cancel" disabled={busy} onClick={() => setShowNewGame(false)}>Back to puzzle</button>}</div></div>}
      {lost && !showNewGame && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lost-title"><div className="modal-card"><h2 id="lost-title">You lost this game.</h2><p>You made 3 mistakes. Try a new puzzle or choose another difficulty.</p><button className="complete-action" disabled={busy} onClick={() => startGame(difficulty, true)}>Try again with a new puzzle</button><button className="modal-cancel" disabled={busy} onClick={backToLevels}>Choose another difficulty</button>{notice && <p role="status">{notice}</p>}</div></div>}
      {completed && !showNewGame && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="complete-title"><div className="modal-card completion-card"><div className="completion-mark"><Trophy size={28}/></div><p className="eyebrow">PUZZLE COMPLETE</p><h2 id="complete-title">Beautifully solved.</h2><p>You finished this {difficulty} puzzle in {formatTime(seconds)} with {mistakes} mistakes and {hintsUsed} hints.</p><button className="complete-action" disabled={busy} onClick={backToLevels}>Choose your next puzzle</button></div></div>}
    </main>
  );
}
