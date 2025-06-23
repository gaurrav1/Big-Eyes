import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { calculateDistance } from '../../utils/geoUtils';
import { LocationSearch } from '../location/LocationSearch';
import styles from './CityList.module.css';

export const CityList = () => {
  const { appData, updateAppData } = useAppContext();
  const { centerOfCityCoordinates, commuteDistance, otherCities } = appData;
  const [activeIndex, setActiveIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleAddCity = useCallback((location) => {
    if (!centerOfCityCoordinates) {
      alert('Please select a center city first');
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
    } else {
      alert(`❌ Distance is ${distance.toFixed(2)} km which exceeds your commute distance of ${commuteDistance} km`);
    }
  }, [centerOfCityCoordinates, commuteDistance, otherCities, updateAppData]);

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

  return (
    <>
    <LocationSearch 
          onLocationSelect={handleAddCity}
          placeholder="Add city within commute"
          compact
        />
   
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
          
          return (
            <div 
              key={`${city.label}-${index}`}
              className={`${styles.cityItem} ${index === activeIndex ? styles.active : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
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