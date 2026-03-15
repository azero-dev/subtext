import { useState, useRef, useEffect } from 'react';
import './ColorPicker.css';

const SWATCHES = [
  '#ffffff', '#000000', '#ff4444', '#ffbb00', 
  '#00dd44', '#0099ff', '#8833ff', '#ff33aa'
];

export default function ColorPicker({ color, onChange, label }) {
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef(null);

  const handleCustomClick = () => {
    setShowCustom(true);
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="color-picker-container">
      {label && <label className="color-picker-label">{label}</label>}
      <div className="swatches-grid">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            className={`swatch-btn ${color.toLowerCase() === swatch ? 'selected' : ''}`}
            style={{ backgroundColor: swatch }}
            onClick={() => onChange(swatch)}
            title={`Select ${swatch}`}
          />
        ))}
        {/* Custom Color Button */}
        <button
          className="swatch-btn custom-swatch-btn"
          style={{ 
            background: showCustom ? color : 'conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)' 
          }}
          onClick={handleCustomClick}
          title="Custom Color"
        >
          {showCustom && <span className="custom-indicator"></span>}
        </button>
      </div>

      <input
        type="color"
        ref={inputRef}
        value={color}
        onChange={(e) => {
          onChange(e.target.value);
          setShowCustom(true);
        }}
        className="hidden-color-input"
      />
    </div>
  );
}
