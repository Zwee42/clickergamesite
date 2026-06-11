export interface BuildingDef {
  id: string;
  label: string;
  cost: number;
  cps: number;
  mult: number;
}

export interface BuildingState {
  cost: number;
  cps: number;
  owned: number;
  costMultiplier: number;
}

export interface ClickUpgradeDef {
  id: string;
  label: string;
  desc: string;
  cost: number;
  apply: (state: GameState) => void;
}

export interface BuildingUpgradeDef {
  id: string;
  label: string;
  desc: string;
  cost: number;
  mult: number;
}

export interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  check: (state: GameState) => boolean;
}

export interface ActiveEffect {
  mult: number;
  endTime: number;
}

export interface GameState {
  cookies: number;
  cookiesPerSecond: number;
  cookiesClicked: number;
  cookiesAllTime: number;
  clickPower: number;
  goldenCookiesClicked: number;
  totalPrestige: number;
  prestigeMultiplier: number;
  gameStarted: number;
  soundEnabled: boolean;
  buyMode: number;
  buildings: Record<string, BuildingState>;
  ownedClickUpgrades: Record<string, boolean>;
  ownedBuildingUpgrades: Record<string, Record<string, boolean>>;
  achievements: Record<string, boolean>;
  activeEffects: Record<string, ActiveEffect>;
}

export interface SaveData {
  username: string;
  state: GameState;
  updatedAt: string;
}
