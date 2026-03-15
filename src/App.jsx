import { useState, useEffect } from 'react';
import './App.css';
import TextPanel from './components/TextPanel';
import SubtitlesPanel from './components/SubtitlesPanel';
import useWakeLock from './hooks/useWakeLock';

// SVG Icons
const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);



const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
  </svg>
);

function App() {
  const [activeMode, setActiveMode] = useState('text'); // 'text' or 'subtitles'
  const [isTextSettingsOpen, setIsTextSettingsOpen] = useState(false);
  const [isSubSettingsOpen, setIsSubSettingsOpen] = useState(false);
  const [resetSubtitlesMenu, setResetSubtitlesMenu] = useState(() => () => { });

  const { requestWakeLock } = useWakeLock();

  useEffect(() => {
    requestWakeLock();
  }, [requestWakeLock]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className={`app-container active-${activeMode}`}>

      {/* Top Panel - Main Text Feature / Top Menu */}
      <div className={`panel panel-top ${activeMode === 'text' ? 'panel-active' : 'panel-menu'}`}>

        {/* Top Menu (Visible when Subtitles are active) */}
        {activeMode === 'subtitles' && (
          <div className="menu-bar">
            <div className="menu-actions">
              {/* Menu options for Subtitles go here, left aligned */}
              <button className="icon-btn" onClick={() => setIsSubSettingsOpen(true)}>
                <SettingsIcon />
              </button>
              {/* Opcion para volver a seleccionar otro subtitulo */}
              <button className="menu-switch-btn" onClick={() => resetSubtitlesMenu()} style={{ marginLeft: '8px', height: '40px' }}>
                Search New Sub
              </button>
            </div>

            {/* Right side group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="icon-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
                <FullscreenIcon />
              </button>
              <button className="menu-switch-btn" onClick={() => setActiveMode('text')}>
                <span>Text</span>
              </button>
            </div>
          </div>
        )}

        <div className="active-content">
          {activeMode === 'text' && (
            <TextPanel
              isActive={activeMode === 'text'}
              isSettingsOpen={isTextSettingsOpen}
              onCloseSettings={() => setIsTextSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Bottom Panel - Subtitles Feature / Bottom Menu */}
      <div className={`panel panel-bottom ${activeMode === 'subtitles' ? 'panel-active' : 'panel-menu'}`}>

        {/* Bottom Menu (Visible when Text is active) */}
        {activeMode === 'text' && (
          <div className="menu-bar">
            <div className="menu-actions">
              {/* Settings buttons for Text function */}
              <button className="icon-btn" onClick={() => setIsTextSettingsOpen(true)}>
                <SettingsIcon />
              </button>
              <span>Text Settings</span>
            </div>

            {/* Right side group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="icon-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
                <FullscreenIcon />
              </button>
              <button className="menu-switch-btn" onClick={() => setActiveMode('subtitles')}>
                <span>Subs</span>
              </button>
            </div>
          </div>
        )}

        <div className="active-content">
          {activeMode === 'subtitles' && (
            <SubtitlesPanel
              isActive={activeMode === 'subtitles'}
              isSettingsOpen={isSubSettingsOpen}
              onCloseSettings={() => setIsSubSettingsOpen(false)}
              onShowMenuOptions={setResetSubtitlesMenu}
            />
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
