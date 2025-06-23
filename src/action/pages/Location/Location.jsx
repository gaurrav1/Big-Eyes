import styles from './Location.module.css';
import { CommuteSlider } from '../../components/slider/CommuteSlider';
import { LocationSearch } from '../../components/location/LocationSearch';
import { CityList } from '../../components/location/CityList';
import { useAppContext } from '../../context/AppContext';

export const Location = () => {
  const { appData, updateAppData } = useAppContext();

  const handleCenterSelect = (location) => {
    updateAppData({
      centerOfCityCoordinates: {
        name: location.label,
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

  return (
    <div className={styles.container}>
      <h3>Center Location</h3>
        <LocationSearch
          onLocationSelect={handleCenterSelect}
          placeholder="Enter center city"
        />
        {appData.centerOfCityCoordinates && (
          <div className={styles.selectedCity}>
            <strong>Selected:</strong> {appData.centerOfCityCoordinates.name}
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