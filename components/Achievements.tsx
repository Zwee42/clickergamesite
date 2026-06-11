import { useGame } from '../lib/gameContext';
import { achievementDefs } from '../lib/data';

export default function Achievements() {
  const { state } = useGame();

  return (
    <>
      <h3>Achievements</h3>
      <div className="achievements-list">
        {achievementDefs.map(a => {
          const unlocked = state.achievements[a.id];
          return (
            <div
              key={a.id}
              className={`achievement${unlocked ? ' achievement--unlocked' : ''}`}
              title={a.desc}
            >
              {unlocked ? a.label : '???'}
            </div>
          );
        })}
      </div>
    </>
  );
}
