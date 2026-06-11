import { useGame } from '../lib/gameContext';
import { buildingDefs, upgradeIcons } from '../lib/data';
import { getBuildingMultiplier } from '../lib/gameLogic';

export default function LeftPanel() {
  const { state } = useGame();
  const maxRows = 3;
  const maxPerRow = 5;
  const gap = 6;
  const panelWidth = 260;
  let boxSize = Math.floor((panelWidth - (maxPerRow - 1) * gap) / maxPerRow);
  if (boxSize > 42) boxSize = 42;

  return (
    <div className="left-panel">
      <h2>Owned Upgrades</h2>
      <div className="owned-upgrades">
        {buildingDefs.map(b => {
          const upg = state.buildings[b.id];
          if (!upg || upg.owned === 0) return null;

          const totalSlots = maxRows * maxPerRow;
          const toShow = Math.min(upg.owned, totalSlots);
          const rowsCount = Math.ceil(toShow / maxPerRow);
          const rows: React.ReactNode[] = [];

          for (let r = 0; r < rowsCount; r++) {
            const start = r * maxPerRow;
            const end = Math.min(start + maxPerRow, toShow);
            const boxes: React.ReactNode[] = [];
            for (let i = start; i < end; i++) {
              boxes.push(
                <div
                  key={i}
                  className="upgrade-box"
                  style={{ width: boxSize, height: boxSize }}
                >
                  <img
                    className="upgrade-box-icon"
                    src={upgradeIcons[b.id]}
                    alt={b.label}
                    style={{ width: Math.floor(boxSize * 0.7), height: Math.floor(boxSize * 0.7) }}
                  />
                </div>
              );
            }
            rows.push(
              <div
                key={r}
                className="upgrade-row"
                style={r < rowsCount - 1 ? { borderBottom: 'none', paddingBottom: 0, marginBottom: 0 } : undefined}
              >
                {boxes}
              </div>
            );
          }

          return <div key={b.id}>{rows}</div>;
        })}
        {(!state.buildings || Object.values(state.buildings).every(b => b.owned === 0)) && (
          <div className="owned-upgrades-empty">No upgrades yet. Buy from the shop!</div>
        )}
      </div>
    </div>
  );
}
