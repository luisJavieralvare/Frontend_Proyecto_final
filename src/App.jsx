import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:8080/api/games';
const DEFAULT_NAMES = 'Alice, Bob, Carol, Dave';

// Descriptions in Spanish for each special card type
const SPECIAL_CARD_INFO = {
  FREEZE: {
    emoji: '❄️',
    name: 'Freeze (Congelar)',
    description: 'Congelas a un jugador de tu elección. Ese jugador queda inmediatamente inactivo esta ronda y no puede seguir robando cartas. Elige sabiamente — también puedes aplicártela a ti mismo.',
    color: '#64d8ff',
    bg: 'rgba(10,21,32,0.97)',
    border: '#0ea5e9',
  },
  FLIP_THREE: {
    emoji: '🔄',
    name: 'Flip Three (Voltear Tres)',
    description: 'El jugador que tú elijas debe robar 3 cartas de inmediato, sin poder negarse. Puede salvarle la ronda o hacerle reventar. Elige un rival con pocas cartas para maximizar el riesgo.',
    color: '#c084fc',
    bg: 'rgba(26,10,32,0.97)',
    border: '#a855f7',
  },
  SECOND_CHANCE: {
    emoji: '🛡️',
    name: 'Segunda Oportunidad',
    description: 'Carta defensiva: si sacas una carta duplicada que normalmente te haría reventar, esta carta te salva y se consume. Una vez usada, desaparece. Si ya tienes una, se transfiere a otro jugador activo.',
    color: '#4ade80',
    bg: 'rgba(10,26,16,0.97)',
    border: '#22c55e',
  },
  MULTIPLIER: {
    emoji: '✨',
    name: 'Multiplicador x2',
    description: 'Al finalizar la ronda, tu puntuación de cartas numéricas se multiplica por 2. Se aplica antes que los bonos de suma. Puede disparar tu puntaje total de manera espectacular — ¡plantarte pronto podría ser la mejor jugada!',
    color: '#e879f9',
    bg: 'rgba(26,10,32,0.97)',
    border: '#d946ef',
  },
  ADDER: {
    emoji: '➕',
    name: 'Sumador (+8 / +10)',
    description: 'Agrega puntos fijos a tu marcador de la ronda al finalizar. El valor puede ser +8 o +10 según la carta. Se acumula con el multiplicador x2 y otros bonos. Una gran ventaja si logras plantarte a tiempo.',
    color: '#86efac',
    bg: 'rgba(10,26,10,0.97)',
    border: '#4ade80',
  },
};

function SpecialCardModal({ cardType, onClose }) {
  const info = SPECIAL_CARD_INFO[cardType];
  if (!info) return null;
  return (
    <div className="special-overlay" onClick={onClose}>
      <div
        className="special-modal"
        style={{ borderColor: info.border, background: info.bg }}
        onClick={e => e.stopPropagation()}
      >
        <div className="special-emoji">{info.emoji}</div>
        <div className="special-name" style={{ color: info.color }}>{info.name}</div>
        <p className="special-desc">{info.description}</p>
        <button
          className="btn btn-primary special-close"
          style={{ background: `linear-gradient(135deg, ${info.border}, ${info.color})`, color: '#080b14' }}
          onClick={onClose}
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}

function CardDisplay({ card }) {
  const isObj = typeof card === 'object' && card !== null;
  const type = isObj ? card.type : 'NUMERIC';
  const display = isObj ? card.display : String(card);
  const value = isObj ? card.value : card;

  let cls = 'card';
  if (type === 'FREEZE')         cls += ' card-special card-freeze';
  else if (type === 'FLIP_THREE')    cls += ' card-special card-flip3';
  else if (type === 'SECOND_CHANCE') cls += ' card-special card-second';
  else if (type === 'MULTIPLIER')    cls += ' card-special card-multiplier';
  else if (type === 'ADDER')         cls += ' card-special card-adder';
  else if (value === 0) cls += ' card-gold';
  else if (value <= 4)  cls += ' card-blue';
  else if (value <= 8)  cls += ' card-green';
  else                  cls += ' card-red';

  return <div className={cls} title={type}>{display}</div>;
}

function PlayerModal({ players, activeIndex, title, subtitle, onSelect, excludeSelf }) {
  return (
    <div className="target-overlay">
      <div className="target-modal">
        <div className="target-title">{title}</div>
        <div className="target-subtitle">{subtitle}</div>
        <div className="target-grid">
          {players.map((player, idx) => {
            const disabled = player.busted || player.stood || (excludeSelf && idx === activeIndex);
            return (
              <button
                key={player.name}
                className={`target-btn ${idx === activeIndex ? 'self' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && onSelect(idx)}
                disabled={disabled}
                data-testid={`target-${player.name}`}
              >
                <span className="target-name">{player.name}</span>
                <span className="target-score">{player.totalScore} pts</span>
                {idx === activeIndex && !excludeSelf && <span className="target-tag">tú</span>}
                {disabled && <span className="target-tag out">fuera</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlayerPanel({ player, isActive }) {
  const statusLabel = player.busted ? '💥 Reventó'
    : player.stood   ? '✋ Se plantó'
    : isActive       ? '▶ Tu turno'
    : 'Esperando';

  return (
    <div
      className={`player-panel ${isActive ? 'active' : ''} ${player.busted ? 'busted' : ''} ${player.stood ? 'stood' : ''}`}
      data-testid={`player-${player.name}`}
    >
      <div className="player-header">
        <div className="player-name">{player.name}</div>
        <div className="player-badges">
          {player.hasSecondChance && <span className="badge badge-sc">2DA</span>}
          {player.hasMultiplier   && <span className="badge badge-x2">x2</span>}
          {player.adderBonus > 0  && <span className="badge badge-add">+{player.adderBonus}</span>}
        </div>
      </div>
      <div className="player-total">{player.totalScore} <span>pts</span></div>
      <div className="player-status">{statusLabel}</div>
      <div className="player-hand">
        {(player.hand || []).map((card, i) => (
          <CardDisplay key={i} card={card} />
        ))}
      </div>
      {(player.stood || player.busted) && (
        <div className="player-round-score">Ronda: {player.roundScore} pts</div>
      )}
    </div>
  );
}

// Scoreboard: shows per-round history for all players
function Scoreboard({ roundHistory, players, currentRound }) {
  if (!players || players.length === 0) return null;
  const rounds = Array.from({ length: currentRound - 1 }, (_, i) => i + 1);

  return (
    <div className="scoreboard">
      <div className="scoreboard-title">📊 Contabilidad</div>
      <div className="scoreboard-table-wrap">
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th className="sb-col-ronda">Ronda</th>
              {players.map(p => (
                <th key={p.name} className="sb-col-player">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map(r => {
              const row = roundHistory[r] || {};
              return (
                <tr key={r}>
                  <td className="sb-ronda">{r}</td>
                  {players.map(p => {
                    const pts = row[p.name] ?? '—';
                    const isZero = pts === 0;
                    const isBig = typeof pts === 'number' && pts >= 20;
                    return (
                      <td key={p.name} className={`sb-pts ${isZero ? 'sb-zero' : ''} ${isBig ? 'sb-big' : ''}`}>
                        {pts === 0 ? '0' : pts}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="sb-total-row">
              <td className="sb-total-label">Total</td>
              {players.map(p => (
                <td key={p.name} className="sb-total-val">{p.totalScore}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <span className="legend-item"><span className="card card-gold mini">0</span> 0</span>
      <span className="legend-item"><span className="card card-blue mini">3</span> 1–4</span>
      <span className="legend-item"><span className="card card-green mini">6</span> 5–8</span>
      <span className="legend-item"><span className="card card-red mini">11</span> 9–12</span>
      <span className="legend-item"><span className="card card-freeze mini">❄</span> Freeze</span>
      <span className="legend-item"><span className="card card-flip3 mini">F3</span> Flip 3</span>
      <span className="legend-item"><span className="card card-second mini">2ND</span> 2da Oportunidad</span>
      <span className="legend-item"><span className="card card-multiplier mini">x2</span> x2</span>
      <span className="legend-item"><span className="card card-adder mini">+8</span> Sumador</span>
    </div>
  );
}

export default function App() {
  const [playerNames, setPlayerNames] = useState(DEFAULT_NAMES);
  const [gameId, setGameId]   = useState(null);
  const [state, setState]     = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Round-by-round score history: { roundNumber: { playerName: roundScore } }
  const [roundHistory, setRoundHistory] = useState({});
  // Special card to show modal for
  const [shownSpecial, setShownSpecial] = useState(null);

  const call = async (fn) => {
    setLoading(true); setError(null);
    try { await fn(); }
    catch (e) { setError(e.response?.data?.error || e.message || 'Unknown error'); }
    finally { setLoading(false); }
  };

  // Capture round scores when round changes, and update state
  const updateStateAndHistory = (newData, prevData) => {
    setState(newData);

    // When round advances: backend already added roundScores to totalScore and reset
    // roundScore to 0 for the new round. So we compute the round delta via totalScore diff.
    if (prevData && newData && newData.currentRound > prevData.currentRound) {
      const finishedRound = prevData.currentRound;
      const scores = {};
      newData.players.forEach((p, i) => {
        const prevTotal = prevData.players[i]?.totalScore ?? 0;
        scores[p.name] = p.totalScore - prevTotal;
      });
      setRoundHistory(prev => ({ ...prev, [finishedRound]: scores }));
    }

    // Game over: last round scores also need recording (same delta approach)
    if (newData && newData.gameOver && prevData && !prevData.gameOver) {
      const finishedRound = newData.currentRound;
      const scores = {};
      newData.players.forEach((p, i) => {
        const prevTotal = prevData.players[i]?.totalScore ?? 0;
        scores[p.name] = p.totalScore - prevTotal;
      });
      setRoundHistory(prev => ({ ...prev, [finishedRound]: scores }));
    }
  };

  const startGame = () => call(async () => {
    const names = playerNames.split(',').map(n => n.trim()).filter(Boolean);
    const res = await axios.post(API, { playerNames: names });
    setRoundHistory({});
    setShownSpecial(null);
    setState(res.data);
    setGameId(res.data.gameId);
  });

  const hit = () => call(async () => {
    const prev = state;
    const res = await axios.post(`${API}/${gameId}/hit`);
    updateStateAndHistory(res.data, prev);

    // Show special card modal if any special card was drawn
    const drawn = res.data.lastDrawnCardType;
    if (drawn && drawn !== 'NUMERIC') {
      setShownSpecial(drawn);
    }
  });

  const stand = () => call(async () => {
    const prev = state;
    const res = await axios.post(`${API}/${gameId}/stand`);
    updateStateAndHistory(res.data, prev);
  });

  const applyTarget = (idx) => call(async () => {
    const prev = state;
    const res = await axios.post(`${API}/${gameId}/target/${idx}`);
    updateStateAndHistory(res.data, prev);
  });

  const transferSecondChance = (idx) => call(async () => {
    const prev = state;
    const res = await axios.post(`${API}/${gameId}/transfer/${idx}`);
    updateStateAndHistory(res.data, prev);
  });

  const gameOver        = state?.gameOver;
  const pendingTarget   = state?.pendingTarget;
  const pendingTransfer = state?.pendingTransfer;
  const canAct = state && !gameOver && !pendingTarget && !pendingTransfer && !loading && !shownSpecial;

  const specialName = state?.pendingSpecial === 'FREEZE' ? '❄️ Freeze' : '🔄 Flip Three';

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-wrap"><h1>Flip<span>7</span></h1></div>
        <p className="subtitle">Primero en 200 pts · Duplicado = bust · 7 únicas = +15 bono</p>
      </header>

      <section className="setup-section">
        <div className="setup-row">
          <input
            className="players-input"
            value={playerNames}
            onChange={e => setPlayerNames(e.target.value)}
            placeholder="Nombres separados por coma (mín. 4)"
            data-testid="player-names-input"
          />
          <button className="btn btn-primary" onClick={startGame} disabled={loading} data-testid="start-button">
            {state ? '↺ Nueva Partida' : '▶ Iniciar'}
          </button>
        </div>
        {error && <div className="error-banner" data-testid="error-banner">⚠ {error}</div>}
      </section>

      {state && (
        <>
          <div className="status-bar">
            <span className="round-badge" data-testid="round-badge">Ronda {state.currentRound}</span>
            <span className="status-message" data-testid="status-message">{state.message}</span>
          </div>

          {/* Main layout: game area + scoreboard */}
          <div className="game-layout">
            <div className="game-main">
              <div className="players-grid" data-testid="players-grid">
                {state.players.map((player, idx) => (
                  <PlayerPanel key={player.name} player={player}
                    isActive={!gameOver && !pendingTarget && !pendingTransfer && idx === state.activePlayerIndex} />
                ))}
              </div>

              {!gameOver && !pendingTarget && !pendingTransfer && (
                <div className="actions">
                  <button className="btn btn-hit" onClick={hit} disabled={!canAct} data-testid="hit-button">
                    🃏 Robar Carta
                  </button>
                  <button className="btn btn-stand" onClick={stand} disabled={!canAct} data-testid="stand-button">
                    ✋ Plantarse
                  </button>
                </div>
              )}
            </div>

            {/* Scoreboard panel */}
            <Scoreboard
              roundHistory={roundHistory}
              players={state.players}
              currentRound={state.currentRound}
            />
          </div>

          {/* Modal: choose target for Freeze / Flip Three */}
          {pendingTarget && (
            <PlayerModal
              players={state.players}
              activeIndex={state.activePlayerIndex}
              title={`Elige objetivo para ${specialName}`}
              subtitle="Selecciona cualquier jugador activo — incluso tú mismo"
              onSelect={applyTarget}
              excludeSelf={false}
            />
          )}

          {/* Modal: transfer extra Second Chance to another player */}
          {pendingTransfer && (
            <PlayerModal
              players={state.players}
              activeIndex={state.activePlayerIndex}
              title="Transferir Segunda Oportunidad 🛡️"
              subtitle="Ya tienes una — dásela a otro jugador activo"
              onSelect={transferSecondChance}
              excludeSelf={true}
            />
          )}

          {/* Special card info modal */}
          {shownSpecial && !pendingTarget && !pendingTransfer && (
            <SpecialCardModal
              cardType={shownSpecial}
              onClose={() => setShownSpecial(null)}
            />
          )}

          {gameOver && (
            <div className="winner-banner" data-testid="winner-banner">
              <div className="confetti">🎊</div>
              <div className="winner-label">🏆 GANADOR</div>
              <div className="winner-name" data-testid="winner-name">{state.winner}</div>
              <div className="winner-score">
                {state.players.find(p => p.name === state.winner)?.totalScore} puntos
              </div>
              <button className="btn btn-primary" onClick={startGame}>Jugar de nuevo</button>
            </div>
          )}

          <Legend />
        </>
      )}

      {!state && (
        <div className="welcome">
          <div className="welcome-rules">
            <h2>Cómo jugar</h2>
            <div className="rules-grid">
              <div className="rule-card">🃏<br/><b>Robar</b><br/>Toma una carta y agrégala a tu zona</div>
              <div className="rule-card">✋<br/><b>Plantarse</b><br/>Guarda tus puntos actuales</div>
              <div className="rule-card">💥<br/><b>Bust</b><br/>Número duplicado = 0 pts esta ronda</div>
              <div className="rule-card">⭐<br/><b>Flip 7</b><br/>7 únicas = +15 bono, ronda termina</div>
              <div className="rule-card">❄️<br/><b>Freeze</b><br/>Manda a cualquier jugador — lo congela</div>
              <div className="rule-card">🔄<br/><b>Flip Three</b><br/>Manda a cualquier jugador — roba 3</div>
              <div className="rule-card">🛡️<br/><b>2da Oportunidad</b><br/>Sobrevive un duplicado</div>
              <div className="rule-card">✨<br/><b>x2 / +8 / +10</b><br/>Multiplica o suma al puntaje final</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}