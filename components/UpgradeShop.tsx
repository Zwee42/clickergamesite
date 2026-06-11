import { useGame } from '../lib/gameContext';
import { clickUpgrades, buildingUpgrades, buildingDefs } from '../lib/data';
import { formatNumber } from '../lib/gameLogic';

export default function UpgradeShop() {
  const { state, buyClickUpgrade, buyBuildingUpgrade } = useGame();

  return (
    <div id="upgrade-shop">
      <h3>Click Upgrades</h3>
      {clickUpgrades.map(u => {
        if (state.ownedClickUpgrades[u.id]) return null;
        return (
          <button
            key={u.id}
            className="upgrade-btn upgrade-btn--small"
            disabled={state.cookies < u.cost}
            title={u.desc}
            onClick={() => buyClickUpgrade(u.id)}
          >
            {u.label} - {formatNumber(u.cost)}
          </button>
        );
      })}

      {buildingDefs.map(b => {
        const bg = buildingUpgrades[b.id];
        const hasAny = bg.some(u => !state.ownedBuildingUpgrades[b.id]?.[u.id]);
        if (!hasAny) return null;
        return (
          <div key={b.id}>
            <h4>{b.label} Upgrades</h4>
            {bg.map(u => {
              if (state.ownedBuildingUpgrades[b.id]?.[u.id]) return null;
              return (
                <button
                  key={u.id}
                  className="upgrade-btn upgrade-btn--small"
                  disabled={state.cookies < u.cost}
                  title={u.desc}
                  onClick={() => buyBuildingUpgrade(b.id, u.id)}
                >
                  {u.label} - {formatNumber(u.cost)}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
