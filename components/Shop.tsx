import { useGame } from '../lib/gameContext';
import { buildingDefs, upgradeIcons } from '../lib/data';
import { formatNumber, calcBulkPurchase, getBuildingMultiplier } from '../lib/gameLogic';

export default function Shop() {
  const { state, buyBuilding, setBuyMode, calcBulk } = useGame();
  const modes = [0, 1, 2, 3] as const;
  const modeLabels = ['x1', 'x10', 'x100', 'Max'];

  return (
    <>
      <div className="bulk-bar">
        {modes.map((m, i) => (
          <button
            key={m}
            className={`bulk-btn${state.buyMode === m ? ' bulk-btn--active' : ''}`}
            onClick={() => setBuyMode(m)}
          >
            {modeLabels[i]}
          </button>
        ))}
      </div>

      <div id="shop">
        {buildingDefs.map(b => {
          const upg = state.buildings[b.id];
          if (!upg) return null;
          const bulk = calcBulkPurchase(state, b.id);
          const effectiveCps = upg.cps * getBuildingMultiplier(state, b.id);

          const showBulk = state.buyMode !== 0 && bulk.bought > 1;

          return (
            <button
              key={b.id}
              className="upgrade-btn"
              id={`buy-${b.id}`}
              disabled={state.cookies < upg.cost}
              onClick={() => buyBuilding(b.id)}
            >
              <img className="upgrade-icon" src={upgradeIcons[b.id]} alt={b.label} />
              <div>
                {b.label} (cost: {formatNumber(upg.cost)}
                {showBulk ? <> &times;{bulk.bought} = <b>{formatNumber(bulk.totalCost)}</b></> : ''}
                )<br />
                <small>+{formatNumber(effectiveCps)} cookie/sec</small><br />
                Owned: {upg.owned}
              </div>
            </button>
          );
        })}
      </div>

      <div id="cps-breakdown" className="cps-breakdown">
        {buildingDefs.map(b => {
          const upg = state.buildings[b.id];
          if (!upg || upg.owned === 0) return null;
          const bCps = (() => {
            let cps = upg.cps * upg.owned;
            const bg = state.ownedBuildingUpgrades[b.id];
            if (bg) Object.keys(bg).forEach(id => { if (bg[id]) cps *= 2; });
            return cps;
          })();
          return (
            <div key={b.id} className="cps-row">
              {b.label}: {formatNumber(bCps)} CPS ({upg.owned} owned)
            </div>
          );
        })}
      </div>

      <button
        id="prestige-btn"
        className="upgrade-btn upgrade-btn--small upgrade-btn--special"
        onClick={() => {}}
        style={{ marginTop: 12 }}
      >
        Prestige (Reset)
      </button>
    </>
  );
}
