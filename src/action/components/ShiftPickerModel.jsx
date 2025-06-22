import { useEffect, useRef } from 'react';

export const ShiftPickerModal = ({ options, selected, onSelect, onClose }) => {
  const wheelRef = useRef(null);
  const selectedIndex = options.findIndex(opt => opt === selected);
  
  // Apply 3D transforms to options
  useEffect(() => {
    if (!wheelRef.current) return;
    
    const children = wheelRef.current.children;
    const count = children.length;
    const angle = 360 / count;
    
    for (let i = 0; i < count; i++) {
      const rotateY = angle * i;
      const translateZ = 100; // Adjust for curvature
      const opacity = 1 - Math.abs(i - selectedIndex) * 0.3;
      
      children[i].style.transform = `
        rotateY(${rotateY}deg)
        translateZ(${translateZ}px)
      `;
      children[i].style.opacity = Math.max(0.4, opacity);
    }
  }, [selectedIndex, options]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        const newIndex = (selectedIndex - 1 + options.length) % options.length;
        onSelect(options[newIndex]);
      } else if (e.key === 'ArrowDown') {
        const newIndex = (selectedIndex + 1) % options.length;
        onSelect(options[newIndex]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, options, onSelect, onClose]);

  return (
    <div className={styles.pickerOverlay}>
      <div className={styles.pickerHeader}>
        <button className={styles.backButton} onClick={onClose}>
          ← Back
        </button>
        <h2>Select Shift Type</h2>
      </div>
      
      <div className={styles.wheelContainer}>
        <div 
          ref={wheelRef}
          className={styles.wheel}
        >
          {options.map((option, index) => (
            <div
              key={option}
              className={`${styles.wheelOption} ${
                option === selected ? styles.selected : ''
              }`}
              onClick={() => {
                onSelect(option);
                onClose();
              }}
              tabIndex={0}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.instructions}>
        Use arrow keys to navigate, Enter to select
      </div>
    </div>
  );
};