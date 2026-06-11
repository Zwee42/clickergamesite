import { useGame } from '../lib/gameContext';
import { formatNumber, formatTime } from '../lib/gameLogic';

export default function Stats() {
  const { state } = useGame();

  return (
    <>
      <h3>Statistics</h3>
      <div className="stats-content">
        Cookies baked (all time): {formatNumber(state.cookiesAllTime)}<br />
        Cookies in bank: {formatNumber(state.cookies)}<br />
        Total clicks: {formatNumber(state.cookiesClicked)}<br />
        Golden cookies clicked: {state.goldenCookiesClicked}<br />
        Play time: {formatTime(Math.floor((Date.now() - state.gameStarted) / 1000))}<br />
        Prestige level: {state.totalPrestige} (x{state.prestigeMultiplier.toFixed(1)})
      </div>
    </>
  );
}
