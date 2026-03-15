import { useState, useEffect, useRef, useCallback } from 'react';
import './TextPanel.css';
import ColorPicker from './ColorPicker';

export default function TextPanel({ isActive, isSettingsOpen, onCloseSettings }) {
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(40);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  // Binary-search for the largest font size where the textarea
  // does NOT scroll (scrollHeight === clientHeight).
  const fitText = useCallback(() => {
    const container = containerRef.current;
    const textarea = textareaRef.current;
    if (!container || !textarea || !isActive) return;

    const availW = container.clientWidth;
    const availH = container.clientHeight;

    if (availW === 0 || availH === 0) return;

    const currentText = textarea.value;

    if (!currentText || currentText.trim() === '') {
      textarea.style.fontSize = '24px';
      textarea.style.visibility = 'visible';
      setFontSize(24);
      return;
    }

    let lo = 8;
    let hi = 600;
    let best = lo;

    // Temporarily make textarea invisible so layout doesn't flicker
    textarea.style.visibility = 'hidden';

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      textarea.style.fontSize = `${mid}px`;
      textarea.style.lineHeight = '1.15';

      // Force layout sync — reading scrollHeight forces reflow
      const sh = textarea.scrollHeight;
      const sw = textarea.scrollWidth;

      if (sh <= availH && sw <= availW) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    textarea.style.fontSize = `${best}px`;
    textarea.style.visibility = 'visible';
    setFontSize(best);
  }, [isActive]);

  // Run fitText whenever text changes
  useEffect(() => {
    // Small timeout to allow browser to settle layout after text change
    const id = setTimeout(fitText, 0);
    return () => clearTimeout(id);
  }, [text, fitText]);

  // Watch the container for size changes (keyboard, orientation, resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      clearTimeout(container._fitTimer);
      container._fitTimer = setTimeout(fitText, 50);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [fitText]);

  const handleInput = (e) => {
    setText(e.target.value);
  };

  return (
    <div
      className="text-panel-container"
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
    >
      <textarea
        ref={textareaRef}
        className="text-area"
        value={text}
        onChange={handleInput}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.15',
          color: textColor,
          caretColor: textColor,
        }}
        placeholder="Tap here to type..."
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={onCloseSettings}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Text Settings</h3>
              <button className="close-btn" onClick={onCloseSettings}>✕</button>
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
    </div>
  );
}
