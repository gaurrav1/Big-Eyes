import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './CommuteSlider.module.css';

const DISTANCE_OPTIONS = [5, 15, 25, 35, 50, 75, 150];
const MIN_DISTANCE = Math.min(...DISTANCE_OPTIONS);
const MAX_DISTANCE = Math.max(...DISTANCE_OPTIONS);

export const CommuteSlider = ({ initialValue = 35, onChange }) => {
  const [sliderValue, setSliderValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const animationRef = useRef(null);

  // Snap to nearest value with tie-breaker (lower value on equal distance)
  const snapToNearest = useCallback((value) => {
    return DISTANCE_OPTIONS.reduce((closest, option) => {
      const currentDiff = Math.abs(closest - value);
      const optionDiff = Math.abs(option - value);
      
      if (optionDiff < currentDiff) return option;
      if (optionDiff === currentDiff) return Math.min(closest, option);
      return closest;
    }, DISTANCE_OPTIONS[0]);
  }, []);

  // Handle slider value change
  const handleChange = useCallback((e) => {
    const rawValue = Number(e.target.value);
    setSliderValue(rawValue);
    
    // Cancel any pending snap animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Handle snap on release
  const handleRelease = useCallback(() => {
    const snappedValue = snapToNearest(sliderValue);
    setSliderValue(snappedValue);
    onChange?.(snappedValue);
    setIsDragging(false);
  }, [sliderValue, onChange, snapToNearest]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const currentIndex = DISTANCE_OPTIONS.indexOf(sliderValue);
    
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      const newValue = DISTANCE_OPTIONS[currentIndex - 1];
      setSliderValue(newValue);
      onChange?.(newValue);
    } else if (e.key === 'ArrowRight' && currentIndex < DISTANCE_OPTIONS.length - 1) {
      const newValue = DISTANCE_OPTIONS[currentIndex + 1];
      setSliderValue(newValue);
      onChange?.(newValue);
    }
  }, [sliderValue, onChange]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate positions for marks
  const calculatePosition = (value) => {
    return ((value - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.labelsContainer}>
        {DISTANCE_OPTIONS.map((distance) => (
          <div 
            key={distance}
            className={`${styles.distanceLabel} ${sliderValue === distance ? styles.activeLabel : ''}`}
            style={{ left: `${calculatePosition(distance)}%` }}
          >
            {distance}<span className={styles.unit}>km</span>
          </div>
        ))}
      </div>
      
      <div className={styles.sliderTrack}>
        <div 
          className={styles.sliderProgress}
          style={{ width: `${calculatePosition(sliderValue)}%` }}
        />
        
{DISTANCE_OPTIONS.map((distance) => (
  <div
    key={`marker-${distance}`}
    className={`${styles.sliderMarker} ${distance <= sliderValue ? styles.activeMarker : ''}`}
    style={{ left: `${calculatePosition(distance)}%` }}
  />
))}

        
        <input
          ref={sliderRef}
          type="range"
          min={MIN_DISTANCE}
          max={MAX_DISTANCE}
          value={sliderValue}
          onChange={handleChange}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          onBlur={handleRelease}
          onKeyDown={handleKeyDown}
          aria-label="Commute distance"
          className={styles.sliderInput}
        />
        
        <div 
          className={`${styles.sliderThumb} ${isDragging ? styles.dragging : ''}`}
          style={{ left: `${calculatePosition(sliderValue)}%` }}
        />
      </div>
    </div>
  );
};
