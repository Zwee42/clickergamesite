import { useRef, useEffect } from 'react';
import { useGame } from '../lib/gameContext';
import { formatNumber, getCpsForDisplay, getEffectiveCps } from '../lib/gameLogic';
import { buildingDefs } from '../lib/data';

export default function CenterPanel() {
  const { state, clickCookie } = useGame();
  const cursorCircleRef = useRef<HTMLDivElement>(null);

  const cps = getCpsForDisplay(state);
  const hasEffects = Object.keys(state.activeEffects).length > 0;

  useEffect(() => {
    if (!cursorCircleRef.current) return;
    const c = cursorCircleRef.current;
    c.innerHTML = '';
    const cursorCount = state.buildings.cursor?.owned ?? 0;
    for (let i = 0; i < cursorCount; i++) {
      const el = document.createElement('div');
      el.className = 'visual-cursor';
      c.appendChild(el);
    }
    const cursors = c.querySelectorAll('.visual-cursor');
    const step = 360 / Math.max(cursors.length, 1);
    cursors.forEach((el, i) => {
      (el as HTMLElement).style.transform = `rotate(${step * i}deg) translate(100px) rotate(-${step * i}deg)`;
    });
  }, [state.buildings.cursor?.owned]);

  const now = Date.now();
  const badgeLabels: Record<string, string> = {
    frenzy: 'Frenzy x7',
    clickFrenzy: 'Click Frenzy x777',
    clot: 'Clot x0.5',
  };

  const effectEntries = Object.entries(state.activeEffects).filter(([_, e]) => e.endTime > now);

  return (
    <div className="center-panel">
      <div className="active-effects" style={{ display: effectEntries.length > 0 ? 'flex' : 'none' }}>
        {effectEntries.map(([id, e]) => {
          const remaining = Math.max(0, Math.ceil((e.endTime - now) / 1000));
          const timer = remaining > 0 ? ` [${remaining}s]` : '';
          if (id.startsWith('building_special_')) {
            const type = id.replace('building_special_', '');
            const b = buildingDefs.find(x => x.id === type);
            return (
              <span key={id} className="effect-badge effect-badge--special">
                {b?.label ?? type} x10{timer}
              </span>
            );
          }
          return (
            <span key={id} className={`effect-badge effect-badge--${id}`}>
              {(badgeLabels[id] || id) + timer}
            </span>
          );
        })}
      </div>

      <h1>Cookie Clicker</h1>
      <div className="score-board">
        <p>Cookies: <span id="cookie-count">{formatNumber(state.cookies)}</span></p>
        <p>per second: <span id="cookies-per-second">{formatNumber(cps)}{hasEffects ? ' (!)' : ''}</span></p>
      </div>

      <div className="cookie-container">
        <div className="cookie-glow" />
        <div id="cursor-circle" className="cursor-circle" ref={cursorCircleRef} />
        <div className="cookie-wrapper">
          <button className="cookie-btn" onClick={clickCookie}>
            <img src="img/cookiev3.png" alt="Cookie" />
          </button>
        </div>
      </div>
    </div>
  );
}
