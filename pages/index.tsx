import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import LeftPanel from '../components/LeftPanel';
import CenterPanel from '../components/CenterPanel';
import RightPanel from '../components/RightPanel';

export default function Home() {
  const { username, setUsername, login, state } = useGame();
  const [nameInput, setNameInput] = useState('');

  if (!username) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif',
        backgroundColor: '#87CEEB',
      }}>
        <h1 style={{ color: '#5b3a1d', marginBottom: 20 }}>Cookie Clicker</h1>
        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setUsername(nameInput.trim()); login(); } }}
          placeholder="Enter username"
          style={{
            padding: '10px 16px', fontSize: 18, borderRadius: 8, border: '2px solid #DEB887',
            width: 250, textAlign: 'center', outline: 'none',
          }}
        />
        <button
          onClick={() => { if (nameInput.trim()) { setUsername(nameInput.trim()); login(); } }}
          style={{
            marginTop: 12, padding: '10px 30px', fontSize: 16, borderRadius: 8,
            border: 'none', backgroundColor: '#D2691E', color: 'white', cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Play
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
}
