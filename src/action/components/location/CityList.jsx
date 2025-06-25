import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LocationSearch } from '../location/LocationSearch';
import { PrioritizedList } from '../common/PrioritizedList';
import styles from './CityList.module.css';

export const CityList = () => {
  const { appData, updateAppData } = useAppContext();
  const { centerOfCityCoordinates, commuteDistance, otherCities } = appData;
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

  // Handle reordering cities
  const handleReorderCities = useCallback((newCities) => {
    updateAppData({ otherCities: newCities });
  }, [updateAppData]);

  // Handle deleting cities
  const handleDeleteCities = useCallback((citiesToDelete) => {
    const newCities = otherCities.filter(city => 
      !citiesToDelete.some(deleteCity => 
        deleteCity.lat === city.lat && deleteCity.lng === city.lng
      )
    );
    updateAppData({ otherCities: newCities });
    setAddCityError(null);
  }, [otherCities, updateAppData]);

  const resetCities = () => {
    updateAppData({ otherCities: [] });
    setAddCityError(null);
  };

  // Render city content
  const renderCityContent = useCallback((city) => {
    return (
      <div className={styles.cityInfo}>
        <div className={styles.cityName}>{city.label}</div>
        <div className={styles.cityDetails}>
          {city.municipality && <span>{city.municipality}, </span>}
          {city.region}
        </div>
      </div>
    );
  }, []);

  // Render city distance
  const renderCityDistance = useCallback((city) => {
    if (!centerOfCityCoordinates) return null;

    const distance = calculateDistance(
      centerOfCityCoordinates.lat,
      centerOfCityCoordinates.lng,
      city.lat,
      city.lng
    );

    const isWithin = distance <= commuteDistance;

    return (
      <div className={`${styles.distance} ${isWithin ? styles.within : styles.over}`}>
        {distance.toFixed(2)} km
      </div>
    );
  }, [centerOfCityCoordinates, commuteDistance]);

  return (
    <>
      <div className={styles.headerRow}>
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
        <PrioritizedList
          items={otherCities}
          onReorder={handleReorderCities}
          onDelete={handleDeleteCities}
          renderItemContent={renderCityContent}
          renderItemExtra={renderCityDistance}
          confirmDelete={false}
          emptyMessage={
            <div className={styles.emptyState}>
              <p>No cities added yet</p>
              <p>Search for cities within your commute distance</p>
            </div>
          }
          showEditButton={true}
          allowMultiDelete={true}
          className={styles.cityPriorityList}
        />
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
