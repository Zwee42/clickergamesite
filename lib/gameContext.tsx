import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GameState } from './types';
import {
  getEffectiveCps, getCpsForDisplay, getClickPower,
  buyBuilding as logicBuyBuilding,
  buyClickUpgrade as logicBuyClickUpgrade,
  buyBuildingUpgrade as logicBuyBuildingUpgrade,
  doPrestige as logicDoPrestige,
  applyGoldenEffect, startEffect,
  createInitialState, calcBulkPurchase, getBuyCount, randInt,
} from './gameLogic';
import { buildingDefs } from './data';

interface GameContextType {
  state: GameState;
  username: string;
  loading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => void;
  clickCookie: (event?: React.MouseEvent) => void;
  buyBuilding: (type: string) => void;
  buyClickUpgrade: (id: string) => void;
  buyBuildingUpgrade: (type: string, id: string) => void;
  doPrestige: () => void;
  setBuyMode: (mode: number) => void;
  toggleSound: () => void;
  hardReset: () => void;
  calcBulk: (type: string) => { bought: number; totalCost: number };
  addVisualCursor: () => void;
  rebuildVisualCursors: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState());
  const [username, setUsername] = useState('');
  const [goldenTimer, setGoldenTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [initialized, setInitialized] = useState(false);
  const stateRef = useRef(state);
  const usernameRef = useRef(username);
  stateRef.current = state;
  usernameRef.current = username;

  const saveToServer = useCallback(async (s: GameState, name: string) => {
    if (!name) return;
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, state: s }),
      });
    } catch {}
  }, []);

  const loadFromServer = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/load?username=' + encodeURIComponent(name));
      if (res.ok) {
        const saved: GameState = await res.json();
        setState(s => ({ ...s, ...saved }));
        return true;
      }
    } catch {}
    return false;
  }, []);

  const login = useCallback(async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim() }),
      });
      if (!res.ok) return;
      const { token } = await res.json();
      localStorage.setItem('token', token);
    } catch { return; }
    setUsername(name.trim());
    const exists = await loadFromServer(name.trim());
    if (!exists) {
      const fresh = createInitialState();
      setState(fresh);
      await saveToServer(fresh, name.trim());
    }
  }, [loadFromServer, saveToServer]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUsername('');
    setState(createInitialState());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setInitialized(true); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name = payload.username;
      if (!name) { setInitialized(true); return; }
      setUsername(name);
      loadFromServer(name).finally(() => setInitialized(true));
    } catch {
      localStorage.removeItem('token');
      setInitialized(true);
    }
  }, [loadFromServer]);

  const flushSave = useCallback(() => {
    const name = usernameRef.current;
    if (!name) return;
    saveToServer(stateRef.current, name);
  }, [saveToServer]);

  useEffect(() => {
    const interval = setInterval(flushSave, 5000);
    return () => clearInterval(interval);
  }, [flushSave]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const cps = getCpsForDisplay(prev);
        return {
          ...prev,
          cookies: prev.cookies + cps / 10,
          cookiesAllTime: prev.cookiesAllTime + cps / 10,
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = Date.now();
    setState(prev => {
      const expired: string[] = [];
      Object.entries(prev.activeEffects).forEach(([id, effect]) => {
        if (effect.endTime <= now) expired.push(id);
      });
      if (expired.length === 0) return prev;
      const next = { ...prev, activeEffects: { ...prev.activeEffects } };
      expired.forEach(id => delete next.activeEffects[id]);
      return next;
    });
  }, [state.activeEffects]);

  const scheduleGolden = useCallback(() => {
    if (goldenTimer) clearTimeout(goldenTimer);
    const delay = randInt(30, 180) * 1000;
    const t = setTimeout(() => {
      setState(prev => ({ ...prev }));
      scheduleGolden();
    }, delay);
    setGoldenTimer(t);
  }, [goldenTimer]);

  useEffect(() => {
    if (username) scheduleGolden();
    return () => { if (goldenTimer) clearTimeout(goldenTimer); };
  }, [username]);

  const clickCookie = useCallback((event?: React.MouseEvent) => {
    setState(prev => {
      const power = getClickPower(prev);
      const now = Date.now();
      return {
        ...prev,
        cookies: prev.cookies + power,
        cookiesClicked: prev.cookiesClicked + 1,
        cookiesAllTime: prev.cookiesAllTime + power,
        gameStarted: prev.gameStarted === 0 ? now : prev.gameStarted,
      };
    });
    if (Math.random() < 0.01) {
      // spawn golden cookie
    }
  }, []);

  const buyBuildingHandler = useCallback((type: string) => {
    setState(prev => {
      const building = prev.buildings[type];
      if (!building) return prev;
      const cloned = { ...building };
      const tempState = { ...prev, buildings: { ...prev.buildings, [type]: cloned } };
      const count = logicBuyBuilding(tempState, type);
      if (count === 0) return prev;
      return { ...tempState, buildings: { ...tempState.buildings, [type]: { ...cloned } } };
    });
  }, []);

  const buyClickUpgradeHandler = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, ownedClickUpgrades: { ...prev.ownedClickUpgrades } };
      if (logicBuyClickUpgrade(next, id)) return next;
      return prev;
    });
  }, []);

  const buyBuildingUpgradeHandler = useCallback((type: string, id: string) => {
    setState(prev => {
      const next = { ...prev, ownedBuildingUpgrades: { ...prev.ownedBuildingUpgrades } };
      if (logicBuyBuildingUpgrade(next, type, id)) return next;
      return prev;
    });
  }, []);

  const doPrestigeHandler = useCallback(() => {
    setState(prev => {
      const next = { ...prev };
      if (logicDoPrestige(next)) return next;
      return prev;
    });
  }, []);

  const setBuyModeHandler = useCallback((mode: number) => {
    setState(prev => ({ ...prev, buyMode: mode }));
  }, []);

  const toggleSoundHandler = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const hardResetHandler = useCallback(() => {
    if (!confirm('Delete ALL progress?')) return;
    const name = usernameRef.current;
    if (!name) return;
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, state: null }),
    }).catch(() => {});
    setState(createInitialState());
  }, []);

  const addVisualCursor = useCallback(() => {}, []);
  const rebuildVisualCursors = useCallback(() => {}, []);

  const calcBulk = useCallback((type: string) => {
    return calcBulkPurchase(stateRef.current, type);
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      username,
      loading: !initialized,
      login,
      logout,
      clickCookie,
      buyBuilding: buyBuildingHandler,
      buyClickUpgrade: buyClickUpgradeHandler,
      buyBuildingUpgrade: buyBuildingUpgradeHandler,
      doPrestige: doPrestigeHandler,
      setBuyMode: setBuyModeHandler,
      toggleSound: toggleSoundHandler,
      hardReset: hardResetHandler,
      calcBulk,
      addVisualCursor,
      rebuildVisualCursors,
    }}>
      {children}
    </GameContext.Provider>
  );
}
