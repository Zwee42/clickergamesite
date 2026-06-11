import { useState } from 'react';
import Shop from './Shop';
import UpgradeShop from './UpgradeShop';
import Achievements from './Achievements';
import Stats from './Stats';
import Settings from './Settings';

const tabs = [
  { id: 'buildings', label: 'Buildings' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'achievements', label: 'Ach.' },
  { id: 'stats', label: 'Stats' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('buildings');

  return (
    <div className="right-panel">
      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`tab-content${activeTab === 'buildings' ? ' tab-content--active' : ''}`} id="tab-buildings">
        <Shop />
      </div>
      <div className={`tab-content${activeTab === 'upgrades' ? ' tab-content--active' : ''}`} id="tab-upgrades">
        <UpgradeShop />
      </div>
      <div className={`tab-content${activeTab === 'achievements' ? ' tab-content--active' : ''}`} id="tab-achievements">
        <Achievements />
      </div>
      <div className={`tab-content${activeTab === 'stats' ? ' tab-content--active' : ''}`} id="tab-stats">
        <Stats />
      </div>
      <div className={`tab-content${activeTab === 'settings' ? ' tab-content--active' : ''}`} id="tab-settings">
        <Settings />
      </div>
    </div>
  );
}
