import { useState, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { LocationSearch } from "./LocationSearch.jsx";
import { PrioritizedList } from "../common/PrioritizedList";
import styles from "./CityList.module.css";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import {WarningText} from "../general/WarningText.jsx";

export const CityList = () => {
  const { appData, updateAppData } = useAppContext();
  const { centerOfCityCoordinates, commuteDistance, otherCities } = appData;
  const [addCityError, setAddCityError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [sortOrder, setSortOrder] = useState(null); // null, "asc", "desc"

  const handleAddCity = useCallback(
    (location) => {
      if (!centerOfCityCoordinates) {
        setAddCityError("Please select a center city first");
        return;
      }

      // Check for duplicate
      const isDuplicate = otherCities.some(
        (city) => city.lat === location.lat && city.lng === location.lng,
      );

      if (isDuplicate) {
        setAddCityError("This city is already added");
        return;
      }

      const distance = calculateDistance(
        centerOfCityCoordinates.lat,
        centerOfCityCoordinates.lng,
        location.lat,
        location.lng,
      );

      if (distance <= commuteDistance) {
        updateAppData({
          otherCities: [...otherCities, location],
        });
        setAddCityError(null);
      } else {
        setAddCityError(
          `Distance is ${distance.toFixed(2)} km which exceeds your commute distance of ${commuteDistance} km`,
        );
      }
    },
    [centerOfCityCoordinates, commuteDistance, otherCities, updateAppData],
  );

  // Handle reordering cities
  const handleReorderCities = useCallback(
    (newCities) => {
      updateAppData({ otherCities: newCities });
    },
    [updateAppData],
  );

  // Handle deleting cities
  const handleDeleteCities = useCallback(
    (citiesToDelete) => {
      const newCities = otherCities.filter(
        (city) =>
          !citiesToDelete.some(
            (deleteCity) =>
              deleteCity.lat === city.lat && deleteCity.lng === city.lng,
          ),
      );
      updateAppData({ otherCities: newCities });
      setAddCityError(null);
    },
    [otherCities, updateAppData],
  );

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
  const renderCityDistance = useCallback(
    (city) => {
      if (!centerOfCityCoordinates) return null;

      const distance = calculateDistance(
        centerOfCityCoordinates.lat,
        centerOfCityCoordinates.lng,
        city.lat,
        city.lng,
      );

      const isWithin = distance <= commuteDistance;

      return (
        <div
          className={`${styles.distance} ${isWithin ? styles.within : styles.over}`}
        >
          {distance.toFixed(2)} km
        </div>
      );
    },
    [centerOfCityCoordinates, commuteDistance],
  );

  // Remove local sorting logic; sorting will update appData.otherCities directly

  // UI for sort controls
  const handleSort = (order) => {
    if (!centerOfCityCoordinates) return;
    if (sortOrder === order) {
      setSortOrder(null);
      // Optionally, you could restore to manual order if you keep a backup
      // For now, do nothing (keeps current order)
    } else {
      setSortOrder(order);
      // Sort and update appData
      const sorted = [...otherCities].sort((a, b) => {
        const distA = calculateDistance(
          centerOfCityCoordinates.lat,
          centerOfCityCoordinates.lng,
          a.lat,
          a.lng,
        );
        const distB = calculateDistance(
          centerOfCityCoordinates.lat,
          centerOfCityCoordinates.lng,
          b.lat,
          b.lng,
        );
        return order === "asc" ? distA - distB : distB - distA;
      });
      updateAppData({ otherCities: sorted });
    }
  };

  const renderSortControls = () => (
    <div className={styles.sortControls}>
      <button
        className={`${styles.sortButton} ${sortOrder === "asc" ? styles.activeSort : ""}`}
        onClick={() => handleSort("asc")}
        type="button"
        aria-label="Sort by distance ascending"
      >
        <FaSortAmountUp /> Asc
      </button>
      <button
        className={`${styles.sortButton} ${sortOrder === "desc" ? styles.activeSort : ""}`}
        onClick={() => handleSort("desc")}
        type="button"
        aria-label="Sort by distance descending"
      >
        <FaSortAmountDown /> Desc
      </button>
    </div>
  );

  // Enhanced edit mode toggle to expose sort controls
  const handleEditModeToggle = () => setEditMode((prev) => !prev);

  return (
    <div className={styles.otherCitiesContainer}>
      {/* Reset button now handled by PrioritizedList via onReset prop */}

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
        <WarningText text={"Select center city to add optional cities"} />
      )}

      <div className={styles.cityListContainer}>



        <PrioritizedList
          items={otherCities}
          onReorder={handleReorderCities}
          onDelete={handleDeleteCities}
          renderItemContent={renderCityContent}
          renderItemExtra={renderCityDistance}
          confirmDelete={false}
          emptyMessage="No cities selected yet"
          showEditButton={false}
          allowMultiDelete={true}
          className={styles.cityPriorityList}
        >
            { (otherCities.length > 0) && (
                <div className={styles.priorityListHeaderRow}>
                    <button
                        className={styles.editButton}
                        onClick={handleEditModeToggle}
                        type="button"
                    >
                        {editMode ? "Done" : "Edit"}
                    </button>
                    <button
                        className={styles.resetButton}
                        onClick={resetCities}
                        type="button"
                    >
                        Reset List
                    </button>
                    {editMode && renderSortControls()}
                </div>
            ) }
        </PrioritizedList>
        {/*<div className={styles.disclaimer}>*/}
        {/*  <strong>Disclaimer:</strong> The suggestion list may show cities all*/}
        {/*  over Canada and the US because the API is powered by Amazon servers.*/}
        {/*  Only select cities where you are sure an Amazon station exists;*/}
        {/*  otherwise, the filter will ignore your choice if the selected city is*/}
        {/*  unknown during job search.*/}
        {/*</div>*/}
      </div>
    </div>
  );
};

// Calculate distance function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
};
