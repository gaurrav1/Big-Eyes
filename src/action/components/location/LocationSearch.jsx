import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import styles from './LocationSearch.module.css';

const DEBOUNCE_DELAY = 300;
const MIN_INPUT_LENGTH = 3;

export const LocationSearch = ({
  onLocationSelect,
  placeholder = 'Search city...',
  compact = false,
  centerCoordinates = null,
  commuteDistance = null,
  disabled = false,
  currentLocation = false,
  error = null
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const cancelToken = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsListRef = useRef(null);
  const inputRef = useRef(null);
  const lastInteractionType = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < MIN_INPUT_LENGTH) {
      setSuggestions([]);
      return;
    }

    if (cancelToken.current) {
      cancelToken.current.cancel('New request initiated');
    }

    cancelToken.current = axios.CancelToken.source();
    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql',
        {
          operationName: 'queryGeoInfoByAddress',
          variables: {
            geoAddressQueryRequest: {
              address: query,
              countries: ['CAN', 'USA'],
            },
          },
          query: "query queryGeoInfoByAddress($geoAddressQueryRequest: GeoAddressQueryRequest!) {\n  queryGeoInfoByAddress(geoAddressQueryRequest: $geoAddressQueryRequest) {\n    country\n    lat\n    lng\n    postalCode\n    label\n    municipality\n    region\n    subRegion\n    addressNumber\n    __typename\n  }\n}\n",
        },
        {
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
          cancelToken: cancelToken.current.token,
        }
      );

      setSuggestions(response.data?.data?.queryGeoInfoByAddress || []);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('API Error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
      if (cancelToken.current) {
        cancelToken.current.cancel();
      }
    };
  }, [inputValue, fetchSuggestions]);

  const handleSelect = useCallback((location) => {
    setInputValue('');
    setSuggestions([]);
    setHighlightedIndex(-1);
    onLocationSelect({
      name: location.label,
      lat: location.lat,
      lng: location.lng,
      region: location.region,
      municipality: location.municipality,
    });

    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [onLocationSelect]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsListRef.current) {
      const items = suggestionsListRef.current.children;
      if (items.length > highlightedIndex) {
        const item = items[highlightedIndex];
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      lastInteractionType.current = 'keyboard';
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      lastInteractionType.current = 'keyboard';
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    }
  };

  const handleMouseEnter = (index) => {
    if (lastInteractionType.current !== 'keyboard') {
      setHighlightedIndex(index);
    }
  };

  const handleMouseMove = () => {
    lastInteractionType.current = 'mouse';
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
  };

  // Get current location using geolocation API
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Perform reverse geocoding to get city name
          const response = await axios.post(
            'https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql',
              {
                "operationName": "queryGeoInfoByLocation",
                "variables": {
                  "geoLocationQueryRequest": {
                    "lat": latitude,
                    "lng": longitude
                  }
                },
                "query": "query queryGeoInfoByLocation($geoLocationQueryRequest: GeoLocationQueryRequest!) {\n  queryGeoInfoByLocation(geoLocationQueryRequest: $geoLocationQueryRequest) {\n    country\n    lat\n    lng\n    postalCode\n    label\n    municipality\n    region\n    subRegion\n    addressNumber\n    __typename\n  }\n}\n"
              },
            {
              headers: {
                "Authorization": 'Bearer token',
                'Content-Type': 'application/json',
              },
            }
          );

          const locationData = response.data?.data?.queryGeoInfoByLocation[0];

          if (locationData) {
            console.log(locationData);
            handleSelect({
              label: locationData.label,
              lat: locationData.lat,
              lng: locationData.lng,
              region: locationData.region,
              municipality: locationData.municipality,
            });
          } else {
            setLocationError('Could not determine your location');
          }
        } catch (error) {
          console.error('Error getting location:', error);
          setLocationError('Error getting location information');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Error getting your location';

        if (error.code === 1) {
          errorMessage = 'Location access denied. Please allow location access.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Please try again.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }

        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [handleSelect]);

  // Calculate distance for suggestion
  const calculateSuggestionDistance = useCallback((suggestion) => {
    if (!centerCoordinates || !commuteDistance) return null;

    return calculateDistance(
      centerCoordinates.lat,
      centerCoordinates.lng,
      suggestion.lat,
      suggestion.lng
    );
  }, [centerCoordinates, commuteDistance]);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div 
        className={`${styles.searchContainer} ${isFocused ? styles.focused : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${styles.input} ${compact ? styles.compactInput : ''}`}
          aria-label="City search"
          disabled={disabled}
        />

        {(currentLocation && !disabled) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              getCurrentLocation();
            }}
            className={styles.locationButton}
            title="Use current location"
            disabled={isGettingLocation}
          >
            {(isLoading || isGettingLocation)
                ? (
                    <div className={styles.statusIndicator}>
                      <div className={styles.spinner} />
                    </div>
                ) : (
                <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                >
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
                )
            }

          </button>
        )}
      </div>

      {(error || locationError) && (
        <div className={styles.errorText}>
          {locationError || error}
        </div>
      )}

      {suggestions.length > 0 && isFocused && (
        <ul 
          className={styles.suggestionsList}
          ref={suggestionsListRef}
          onMouseMove={handleMouseMove}
        >
          {suggestions.map((location, index) => {
            const distance = calculateSuggestionDistance(location);
            const isWithin = distance !== null && distance <= commuteDistance;

            return (
              <li
                key={`${location.label}-${index}`}
                onMouseDown={() => handleSelect(location)}
                onMouseEnter={() => handleMouseEnter(index)}
                className={`${styles.suggestionItem} ${
                  highlightedIndex === index ? styles.highlighted : ''
                } ${
                  distance !== null ? (isWithin ? styles.within : styles.over) : ''
                }`}
              >
                <div className={styles.locationLabel}>{location.label}</div>
                <div className={styles.locationDetails}>
                  {location.municipality && <span>{location.municipality}, </span>}
                  {location.region}
                </div>

                {distance !== null && (
                  <div className={styles.suggestionDistance}>
                    {distance.toFixed(2)} km
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Helper function moved here for reuse
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
