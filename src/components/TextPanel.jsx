import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './TextPanel.css';

export default function TextPanel({ isActive, isSettingsOpen, onCloseSettings }) {
  const [text, setText] = useState('Escribe aqui...');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const textareaRef = useRef(null);
  
  const [fontSize, setFontSize] = useState(40); // default starting point

  // Function to calculate best font size
  const fitText = () => {
    if (!containerRef.current || !measureRef.current || !isActive) return;

    const container = containerRef.current;
    const measure = measureRef.current;
    
    // We want the text to fit within the container's layout
    // We will do a binary search between min and max font sizes
    let minFont = 10;
    let maxFont = 300;
    let bestFit = 10;

    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;

    // Reset measure width to match container width to ensure wrapping is tested against the right boundary
    measure.style.width = `${maxWidth}px`;

    // Try up to 15 iterations of binary search
    for (let i = 0; i < 15; i++) {
      const midPoint = Math.floor((minFont + maxFont) / 2);
      measure.style.fontSize = `${midPoint}px`;
      measure.style.lineHeight = `1.2`;

      // Wait we don't need async wait usually if it's display block/absolute, DOM reflects immediately in same frame
      const currentWidth = measure.scrollWidth;
      const currentHeight = measure.scrollHeight;

      // Check if it fits (with a tiny buffer to prevent rounding issues)
      if (currentHeight <= maxHeight - 4 && currentWidth <= maxWidth - 4) {
        bestFit = midPoint;
        minFont = midPoint + 1; // Try bigger
      } else {
        maxFont = midPoint - 1; // Must be smaller
      }
      
      if (minFont > maxFont) break;
    }

    setFontSize(bestFit);
  };

  // Re-run fit text when text changes or when panel becomes active
  useLayoutEffect(() => {
    fitText();
  }, [text, isActive]);

  // Hook up resize observer to adjust when keyboard shows/hides
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      fitText();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isActive]);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  return (
    <div 
      className="text-panel-container" 
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
    >
      {/* Hidden measure div identical in style bounds to real textarea */}
      <div 
        className="text-measure" 
        ref={measureRef} 
        style={{ color: textColor }}
      >
        {text === '' ? ' ' : text}
      </div>

      <textarea
        ref={textareaRef}
        className="text-area"
        value={text}
        onChange={handleChange}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.2',
          color: textColor,
          caretColor: textColor
        }}
        placeholder="Type here..."
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={onCloseSettings}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Text Settings</h3>
              <button className="close-btn" onClick={onCloseSettings}>X</button>
            </div>
            
            <div className="setting-group">
              <label>Text Color</label>
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
              />
            </div>

            <div className="setting-group">
              <label>Background Color</label>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)} 
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
