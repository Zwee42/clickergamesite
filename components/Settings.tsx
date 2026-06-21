import { useGame } from '../lib/gameContext';

export default function Settings() {
  const { state, toggleSound, hardReset, logout } = useGame();

  return (
    <>
      <h3>Settings</h3>
      <div className="settings-content">
        <button className="upgrade-btn upgrade-btn--small" onClick={toggleSound}>
          Sound: {state.soundEnabled ? 'ON' : 'OFF'}
        </button>
        <button className="upgrade-btn upgrade-btn--small upgrade-btn--danger" onClick={hardReset}>
          Hard Reset
        </button>
        <button className="upgrade-btn upgrade-btn--small" onClick={logout}>
          Log Out
        </button>
      </div>
    </>
  );
}
