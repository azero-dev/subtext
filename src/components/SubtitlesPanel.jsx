import { useState, useEffect, useRef } from 'react';
import './SubtitlesPanel.css';
import { parseSRT } from '../utils/srtParser';
import ColorPicker from './ColorPicker';

export default function SubtitlesPanel({ isActive, isSettingsOpen, onCloseSettings, onShowMenuOptions }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('os_api_key') || '');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');

  // Stages: 'search', 'languages', 'subtitles', 'player'
  const [stage, setStage] = useState('search');

  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const [subtitlesList, setSubtitlesList] = useState([]);
  const [filteredSubtitles, setFilteredSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  const [srtData, setSrtData] = useState([]);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('os_subtitles_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historyToDelete, setHistoryToDelete] = useState(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [currentText, setCurrentText] = useState('');

  const timerRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Expose an option to the parent to reset stage, so clicking menu can reset
  useEffect(() => {
    if (onShowMenuOptions) {
      // Pass a function that returns the inner function to properly save it in React state
      onShowMenuOptions(() => () => {
        setStage('search');
        setIsPlaying(false);
      });
    }
  }, [onShowMenuOptions]);

  // Persist API Key
  useEffect(() => {
    localStorage.setItem('os_api_key', apiKey);
  }, [apiKey]);

  // Persist History
  useEffect(() => {
    localStorage.setItem('os_subtitles_history', JSON.stringify(history));
  }, [history]);

  const headers = {
    'Api-Key': apiKey,
    'X-User-Agent': 'SubTextApp v1.0'
  };

  const handleSearch = async () => {
    if (!apiKey) {
      alert("Please enter an OpenSubtitles API Key in the Settings first.");
      return;
    }
    if (!searchQuery) return;

    try {
      const res = await fetch(`https://api.opensubtitles.com/api/v1/features?query=${encodeURIComponent(searchQuery)}`, { headers });
      if (res.status === 401 || res.status === 403) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        setMovies([]);
        return;
      }

      const results = data.data.map(m => ({
        id: m.attributes.feature_id || m.id,
        imdb_id: m.attributes.imdb_id,
        tmdb_id: m.attributes.tmdb_id,
        title: m.attributes.original_title || m.attributes.title,
        year: m.attributes.year || ''
      }));
      setMovies(results);
    } catch (err) {
      console.error('Search error:', err);
      alert(`Search failed: ${err.message}`);
    }
  };

  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie);

    try {
      let queryParam = '';
      if (movie.imdb_id) {
        queryParam = `imdb_id=${movie.imdb_id}`;
      } else if (movie.tmdb_id) {
        queryParam = `tmdb_id=${movie.tmdb_id}`;
      } else {
        queryParam = `id=${movie.id}`;
      }

      const res = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${queryParam}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch subtitles");
      const data = await res.json();

      const subs = data.data;
      // Extract unique languages
      const langsMap = new Map();
      subs.forEach(sub => {
        const l = sub.attributes.language || 'default';
        if (!langsMap.has(l)) langsMap.set(l, []);
        langsMap.get(l).push({
          id: sub.attributes.files[0].file_id,
          name: sub.attributes.release || 'Unknown Release',
          language: l
        });
      });

      const langsArray = Array.from(langsMap.keys());
      setLanguages(langsArray);
      setSubtitlesList(subs); // Store all raw subs to filter later
      setStage('languages');

    } catch (err) {
      // Fallback
      setLanguages(['en', 'es']);
      setStage('languages');
    }
  };

  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);

    // Filter the previously fetched subs by language
    if (apiKey) {
      const filtered = subtitlesList.filter(s => s.attributes.language === lang).map(s => ({
        id: s.attributes.files[0].file_id,
        name: s.attributes.release || 'Unknown Release'
      }));
      setFilteredSubtitles(filtered);
    } else {
      // Fallback
      setFilteredSubtitles([
        { id: '101', name: 'Release.1080p.WebRip' },
        { id: '102', name: 'Release.720p.BRRip' }
      ]);
    }
    setStage('subtitles');
  };

  const handleSelectSubtitle = async (sub) => {
    setSelectedSubtitle(sub);

    const historyItem = {
      id: sub.id,
      name: sub.name,
      movieTitle: sub.movieTitle || (selectedMovie ? selectedMovie.title : 'Unknown Movie')
    };

    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== sub.id);
      return [historyItem, ...filtered].slice(0, 50); // Keep last 50
    });

    try {
      if (apiKey) {
        const postRes = await fetch('https://api.opensubtitles.com/api/v1/download', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ file_id: sub.id })
        });
        const postData = await postRes.json();

        if (postData.link) {
          const fileRes = await fetch(postData.link);
          const srtText = await fileRes.text();
          setSrtData(parseSRT(srtText));
        } else {
          console.warn("API did not return a download link. Response:", postData);
          alert(`API Download Error: ${postData.message || postData.error || 'No valid link returned. (A VIP account/Token may be required)'}`);

          // Provide fake SRT so play button can be tested even if download fails
          const fakeSrt = "1\n00:00:00,000 --> 00:00:05,000\n[API Download Failed]\n\n2\n00:00:05,500 --> 00:00:10,000\n" + (postData.message || "VIP account may be required.");
          setSrtData(parseSRT(fakeSrt));
        }
      } else {
        // Fallback fake SRT
        const fakeSrt = "1\n00:00:00,000 --> 00:00:05,000\nThis is a sample subtitle.\n\n2\n00:00:05,500 --> 00:00:10,000\nYou selected: " + sub.name;
        setSrtData(parseSRT(fakeSrt));
      }
      setCurrentTime(0);
      setStage('player');
    } catch (err) {
      alert("Error downloading subtitle");
    }
  };

  // Player Logic
  useEffect(() => {
    if (isPlaying) {
      lastUpdateRef.current = performance.now();
      timerRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
  }, [isPlaying]);

  const updateTimer = (now) => {
    const delta = (now - lastUpdateRef.current) / 1000;
    setCurrentTime(prev => {
      const newTime = prev + delta;
      checkSubtitles(newTime);
      return newTime;
    });
    lastUpdateRef.current = now;
    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const checkSubtitles = (timeSec) => {
    if (!srtData || srtData.length === 0) return;

    // Find active subtitle
    const activeSub = srtData.find(s => timeSec >= s.start && timeSec <= s.end);
    if (activeSub) {
      setCurrentText(activeSub.text);
    } else {
      setCurrentText('');
    }

    // Check end condition (10 seconds after last sub)
    const lastSub = srtData[srtData.length - 1];
    if (lastSub && timeSec > lastSub.end + 10) {
      setIsPlaying(false);
    }
  };

  const adjustTime = (seconds) => {
    setCurrentTime(prev => {
      let newTime = prev + seconds;
      if (seconds < 0 && prev < 2) newTime = 0;

      const lastSub = srtData[srtData.length - 1];
      if (seconds > 0 && lastSub) {
        if (prev > lastSub.end + 10 - 2) {
          // Si quedan menor de 2 segundo para llegar al final y se pulsa sobre +2, no debe ocurrir nada
          return prev;
        }
      }

      checkSubtitles(newTime);
      return Math.max(0, newTime); // never negative
    });
  };

  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  if (!isActive) {
    return null; // Hidden when inactive since App.jsx manages it
  }

  return (
    <div className="subtitles-panel-container" style={{ backgroundColor: bgColor }}>

      {stage === 'search' && (
        <div className="subs-setup-view">
          <h2>Find Subtitles</h2>
          <div className="search-bar">
            <input
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Movie title..."
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>Search</button>
          </div>

          {history.length > 0 && (
            <div className="history-section" style={{ width: '100%', maxWidth: '600px', margin: '20px auto 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2em' }}>Historial</h3>
                <button
                  onClick={() => setHistoryToDelete('all')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Delete history
                </button>
              </div>
              <div className="list-container">
                {history.map(item => (
                  <div key={item.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '10px' }}>
                    <div onClick={() => handleSelectSubtitle({ id: item.id, name: item.name, movieTitle: item.movieTitle })} style={{ flex: 1, cursor: 'pointer' }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{item.movieTitle}</h4>
                      <p style={{ margin: 0, fontSize: '0.85em', opacity: 0.8 }}>{item.name}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setHistoryToDelete(item.id); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '1.2em', cursor: 'pointer', padding: '5px' }}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {movies.length > 0 && (
            <div className="list-container" style={{ marginTop: '20px' }}>
              {movies.map(m => (
                <div key={m.id} className="list-item" onClick={() => handleSelectMovie(m)}>
                  <h4>{m.title}</h4>
                  <p>{m.year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === 'languages' && (
        <div className="subs-setup-view">
          <h2>Select Language</h2>
          <button className="search-btn" style={{ width: 'fit-content', opacity: 0.7 }} onClick={() => setStage('search')}>&larr; Back</button>
          <div className="list-container">
            {languages.map(l => (
              <div key={l} className="list-item" onClick={() => handleSelectLanguage(l)}>
                <h4>{l.toUpperCase()}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === 'subtitles' && (
        <div className="subs-setup-view">
          <h2>Select File</h2>
          <button className="search-btn" style={{ width: 'fit-content', opacity: 0.7 }} onClick={() => setStage('languages')}>&larr; Back</button>
          <div className="list-container">
            {filteredSubtitles.map((s, i) => (
              <div key={s.id || i} className="list-item" onClick={() => handleSelectSubtitle(s)}>
                <h4>{s.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === 'player' && (
        <div className="subs-playback-view" style={{ position: 'relative' }}>
          <div className="time-display">{formatTime(currentTime)}</div>

          <div className="subtitle-text" style={{ fontSize: `${textSize}px`, color: textColor }}>
            {currentText}
          </div>

          <div className="playback-controls">
            <button className="control-btn" onClick={() => adjustTime(-2)}>-2s</button>
            <button className="control-btn play-btn" onClick={() => {
              setIsPlaying(!isPlaying);
              lastUpdateRef.current = performance.now();
            }}>
              {isPlaying ? '||' : '▶'}
            </button>
            <button className="control-btn" onClick={() => adjustTime(2)}>+2s</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={onCloseSettings}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Subtitles Settings</h3>
              <button className="close-btn" onClick={onCloseSettings}>X</button>
            </div>

            <div className="setting-group">
              <label>API Key (OpenSubtitles)</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
                placeholder="YOUR_API_KEY"
              />
            </div>

            <div className="setting-group">
              <label>Text Size ({textSize}px)</label>
              <input
                type="range"
                min="12" max="72"
                value={textSize}
                onChange={(e) => setTextSize(e.target.value)}
              />
            </div>

            <ColorPicker
              label="Text Color"
              color={textColor}
              onChange={setTextColor}
            />

            <ColorPicker
              label="Background Color"
              color={bgColor}
              onChange={setBgColor}
            />

          </div>
        </div>
      )}

      {/* Delete History Confirmation Modal */}
      {historyToDelete !== null && (
        <div className="modal-overlay" onClick={() => setHistoryToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm deletion</h3>
              <button className="close-btn" onClick={() => setHistoryToDelete(null)}>X</button>
            </div>

            <div style={{ padding: '20px 0' }}>
              <p>Are you sure you want to delete {historyToDelete === 'all' ? 'all history' : 'this entry'}?</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setHistoryToDelete(null)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (historyToDelete === 'all') {
                    setHistory([]);
                  } else {
                    setHistory(prev => prev.filter(h => h.id !== historyToDelete));
                  }
                  setHistoryToDelete(null);
                }}
                style={{ background: '#ff4444', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
