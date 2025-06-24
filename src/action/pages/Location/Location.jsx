import { useEffect, useState } from 'react';
import styles from './Location.module.css';
import { CommuteSlider } from '../../components/slider/CommuteSlider';
import { LocationSearch } from '../../components/location/LocationSearch';
import { CityList } from '../../components/location/CityList';
import { useAppContext } from '../../context/AppContext';

export const Location = () => {
  const { appData, updateAppData, isLoaded } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're running on client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCenterSelect = (location) => {
    updateAppData({
      centerOfCityCoordinates: {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        region: location.region,
        municipality: location.municipality
      }
    });
  };

  const handleDistanceChange = (distance) => {
    updateAppData({ commuteDistance: distance });
  };

  // Clear all location preferences
  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all location preferences?')) {
      updateAppData({
        centerOfCityCoordinates: null,
        otherCities: []
      });
    }
  };

  // Only render on client after preferences are loaded
  if (!isClient || !isLoaded) {
    return <div className={styles.loading}>Loading your preferences...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Location Preferences</h2>
        <button 
          className={styles.resetButton}
          onClick={handleResetAll}
          disabled={!appData.centerOfCityCoordinates && appData.otherCities.length === 0}
        >
          Reset
        </button>
      </div>

      <h3>Center Location</h3>
      <LocationSearch
        onLocationSelect={handleCenterSelect}
        placeholder={appData.centerOfCityCoordinates?.name || 'Search for a city...'}
      />
      {appData.centerOfCityCoordinates && (
        <div className={styles.selectedCity}>
          <strong>Selected: {appData.centerOfCityCoordinates.name}</strong>
        </div>
      )}

      <h3>Commute Distance</h3>
      <div className={styles.section}>
        <CommuteSlider
          initialValue={appData.commuteDistance}
          onChange={handleDistanceChange}
        />
        <div className={styles.distanceDisplay}>
          {appData.commuteDistance} km radius
        </div>
      </div>

      <h3>Cities within Commute</h3>
      <CityList />
    </div>
  );
};