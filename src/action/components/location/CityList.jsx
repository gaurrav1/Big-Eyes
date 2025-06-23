import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LocationSearch } from '../location/LocationSearch';
import styles from './CityList.module.css';

export const CityList = () => {
  const { appData, updateAppData } = useAppContext();
  const { centerOfCityCoordinates, commuteDistance, otherCities } = appData;
  const [activeIndex, setActiveIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [addCityError, setAddCityError] = useState(null);

  const handleAddCity = useCallback((location) => {
    if (!centerOfCityCoordinates) {
      setAddCityError('Please select a center city first');
      return;
    }

    // Check for duplicate
    const isDuplicate = otherCities.some(city => 
      city.lat === location.lat && city.lng === location.lng
    );
    
    if (isDuplicate) {
      setAddCityError('This city is already added');
      return;
    }

    const distance = calculateDistance(
      centerOfCityCoordinates.lat,
      centerOfCityCoordinates.lng,
      location.lat,
      location.lng
    );

    if (distance <= commuteDistance) {
      updateAppData({
        otherCities: [...otherCities, location]
      });
      setAddCityError(null);
    } else {
      setAddCityError(
        `Distance is ${distance.toFixed(2)} km which exceeds your commute distance of ${commuteDistance} km`
      );
    }
  }, [centerOfCityCoordinates, commuteDistance, otherCities, updateAppData]);

  const handleRemoveCity = useCallback((index) => {
    const newCities = [...otherCities];
    newCities.splice(index, 1);
    updateAppData({ otherCities: newCities });
    setAddCityError(null);
  }, [otherCities, updateAppData]);

  const handleDragStart = (index) => {
    setActiveIndex(index);
    setIsDragging(true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (activeIndex === null || activeIndex === index) return;
    
    const newCities = [...otherCities];
    const movedItem = newCities[activeIndex];
    newCities.splice(activeIndex, 1);
    newCities.splice(index, 0, movedItem);
    
    updateAppData({ otherCities: newCities });
    setActiveIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setActiveIndex(null);
  };

  const resetCities = () => {
    updateAppData({ otherCities: [] });
    setAddCityError(null);
  };

  return (
    <>
      
        <div className={styles.headerRow}>
          <h3>Cities within Commute</h3>
          {otherCities.length > 0 && (
            <button 
              className={styles.resetButton}
              onClick={resetCities}
            >
              Reset List
            </button>
          )}
        </div>
        
        <LocationSearch 
          onLocationSelect={handleAddCity}
          placeholder="Add city within commute"
          compact
          centerCoordinates={centerOfCityCoordinates}
          commuteDistance={commuteDistance}
          disabled={!centerOfCityCoordinates}
          error={addCityError}
        />
        
        {!centerOfCityCoordinates && (
          <div className={styles.warningText}>
            Select center city to add optional cities
          </div>
        )}
      
   
      <div className={styles.container}>
        <div className={styles.listContainer}>
          {otherCities.map((city, index) => {
            const distance = centerOfCityCoordinates 
              ? calculateDistance(
                  centerOfCityCoordinates.lat,
                  centerOfCityCoordinates.lng,
                  city.lat,
                  city.lng
                )
              : 0;
            
            const isWithin = distance <= commuteDistance;
            const isLastItem = index === otherCities.length - 1;
            
            return (
              <div 
                key={`${city.label}-${index}`}
                className={`${styles.cityItem} ${index === activeIndex ? styles.active : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{ 
                  cursor: isDragging ? 'grabbing' : 'grab',
                  borderBottom: isLastItem ? 'none' : undefined
                }}
              >
                <div className={styles.priorityBadge}>{index + 1}</div>
                <div className={styles.dragHandle}>≡</div>
                
                <div className={styles.cityInfo}>
                  <div className={styles.cityName}>{city.label}</div>
                  <div className={styles.cityDetails}>
                    {city.municipality && <span>{city.municipality}, </span>}
                    {city.region}
                  </div>
                </div>
                
                <div className={`${styles.distance} ${isWithin ? styles.within : styles.over}`}>
                  {distance.toFixed(2)} km
                </div>
                
                <button 
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCity(index);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          
          {otherCities.length === 0 && (
            <div className={styles.emptyState}>
              <p>No cities added yet</p>
              <p>Search for cities within your commute distance</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Calculate distance function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};