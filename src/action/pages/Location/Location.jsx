import { useEffect, useState, useCallback } from "react";
import styles from "./Location.module.css";
import { CommuteSlider } from "../../components/slider/CommuteSlider";
import { LocationSearch } from "../../components/location/LocationSearch";
import { CityList } from "../../components/location/CityList";
import { useAppContext } from "../../context/AppContext";
import { ConfirmationDialog } from "../../components/dialog/ConfirmationDialog";
import {SectionHeader} from "../../components/general/SectionHeader.jsx";
import {Section} from "../../components/general/Section.jsx";
import {Divider} from "../../components/general/Divider.jsx";

export const Location = () => {
  const { appData, updateAppData, isLoaded } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCenterCity, setPendingCenterCity] = useState(null);
  const [citiesExceedingDistance, setCitiesExceedingDistance] = useState([]);

  // Ensure we're running on client after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Check if any cities exceed commute distance with new center
  const checkCitiesExceedingDistance = useCallback(
    (newCenter) => {
      if (!appData.otherCities || appData.otherCities.length === 0) {
        return [];
      }

      return appData.otherCities.filter((city) => {
        const distance = calculateDistance(
          newCenter.lat,
          newCenter.lng,
          city.lat,
          city.lng,
        );
        return distance > appData.commuteDistance;
      });
    },
    [appData.otherCities, appData.commuteDistance, calculateDistance],
  );

  // Handle confirmation of center city change
  const handleConfirmCenterChange = useCallback(() => {
    if (!pendingCenterCity) return;

    // Apply the new center city
    updateAppData({
      centerOfCityCoordinates: {
        name: pendingCenterCity.name,
        lat: pendingCenterCity.lat,
        lng: pendingCenterCity.lng,
        region: pendingCenterCity.region,
        municipality: pendingCenterCity.municipality,
      },
      // Remove cities that exceed commute distance
      otherCities: appData.otherCities.filter(
        (city) =>
          !citiesExceedingDistance.some(
            (exceedingCity) =>
              exceedingCity.lat === city.lat && exceedingCity.lng === city.lng,
          ),
      ),
    });

    // Reset dialog state
    setDialogOpen(false);
    setPendingCenterCity(null);
    setCitiesExceedingDistance([]);
  }, [
    pendingCenterCity,
    updateAppData,
    appData.otherCities,
    citiesExceedingDistance,
  ]);

  // Handle cancellation of center city change
  const handleCancelCenterChange = useCallback(() => {
    setDialogOpen(false);
    setPendingCenterCity(null);
    setCitiesExceedingDistance([]);
  }, []);

  // Handle center city selection
  const handleCenterSelect = useCallback(
    (location) => {
      // If there are no other cities, just update the center
      if (!appData.otherCities || appData.otherCities.length === 0) {
        updateAppData({
          centerOfCityCoordinates: {
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            region: location.region,
            municipality: location.municipality,
          },
        });
        return;
      }

      // Check if any cities exceed commute distance
      const exceedingCities = checkCitiesExceedingDistance(location);

      if (exceedingCities.length > 0) {
        // Store the pending center city and cities exceeding distance
        setPendingCenterCity(location);
        setCitiesExceedingDistance(exceedingCities);
        setDialogOpen(true);
      } else {
        // No cities exceed distance, update directly
        updateAppData({
          centerOfCityCoordinates: {
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            region: location.region,
            municipality: location.municipality,
          },
        });
      }
    },
    [appData.otherCities, checkCitiesExceedingDistance, updateAppData],
  );

  const handleDistanceChange = (distance) => {
    updateAppData({ commuteDistance: distance });
  };

  // Clear all location preferences
  const handleResetAll = () => {
    if (confirm("Are you sure you want to reset all location preferences?")) {
      updateAppData({
        centerOfCityCoordinates: null,
        otherCities: [],
      });
    }
  };

  // Only render on client after preferences are loaded
  if (!isClient || !isLoaded) {
    return <div className={styles.loading}>Loading your preferences...</div>;
  }

  const mainHeader = {
    title: "Location Preferences",
    isMainHeader: true,
    fontSize: "H3",
    isButton: true,
    buttonName: "Reset",
    disabled: !appData.centerOfCityCoordinates && appData.otherCities.length === 0,
    buttonHandler: handleResetAll
  }

  const centerCitySection = {
    title: "Center Location",
    fontSize: "H4"
  }

  const commuteDistanceSection = {
    title: "Commute Distance",
    fontSize: "H4"
  }

  const otherCitiesSection = {
    title: "Cities within Commute",
    fontSize: "H4"
  }

  return (
    <Section className={styles.container} header={mainHeader} >
      <br />
      <Divider />
      <Section header={centerCitySection}>
        <LocationSearch
            onLocationSelect={handleCenterSelect}
            placeholder={
                appData.centerOfCityCoordinates?.name || "Search for a city..."
            }
        />
        {appData.centerOfCityCoordinates && (
            <div className={styles.selectedCity}>
              <strong>Selected: {appData.centerOfCityCoordinates.name}</strong>
            </div>
        )}
      </Section>

      <Section header={commuteDistanceSection}>
        <div className={styles.section}>
          <CommuteSlider
              initialValue={appData.commuteDistance}
              onChange={handleDistanceChange}
          />
          <div className={styles.distanceDisplay}>
            {appData.commuteDistance} km radius
          </div>
        </div>
      </Section>

      <Section header={otherCitiesSection}>
        <CityList />

        {/* Confirmation Dialog for cities exceeding commute distance */}
        <ConfirmationDialog
            isOpen={dialogOpen}
            title="Warning: Cities Exceed Commute Distance"
            message={`Changing your center city will remove ${citiesExceedingDistance.length} ${
                citiesExceedingDistance.length === 1 ? "city" : "cities"
            } that exceed the commute distance of ${appData.commuteDistance} km.`}
            confirmText="Continue"
            cancelText="Cancel"
            onConfirm={handleConfirmCenterChange}
            onCancel={handleCancelCenterChange}
        >
          <div className={styles.dialogCityList}>
            {citiesExceedingDistance.map((city, index) => {
              const distance = calculateDistance(
                  pendingCenterCity?.lat || 0,
                  pendingCenterCity?.lng || 0,
                  city.lat,
                  city.lng,
              );

              return (
                  <div
                      key={`${city.label}-${index}`}
                      className={styles.dialogCityItem}
                  >
                    <div className={styles.dialogCityName}>{city.label}</div>
                    <div className={styles.dialogCityDistance}>
                      {distance.toFixed(2)} km
                    </div>
                  </div>
              );
            })}
          </div>
        </ConfirmationDialog>
      </Section>

    </Section>
  );
};
