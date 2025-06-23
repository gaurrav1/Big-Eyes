import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import styles from './LocationSearch.module.css';

const DEBOUNCE_DELAY = 300;
const MIN_INPUT_LENGTH = 3;

export const LocationSearch = ({ 
  onLocationSelect, 
  placeholder = 'Search city...',
  compact = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const cancelToken = useRef(null);

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
    setError(null);

    try {
      const response = await axios.post(
        'https://e5mquma77feepi2apdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql',
        {
          operationName: 'queryGeoInfoByAddress',
          variables: {
            geoAddressQueryRequest: {
              address: query,
              countries: ['CAN'],
            },
          },
          query: `
            query queryGeoInfoByAddress($geoAddressQueryRequest: GeoAddressQueryRequest!) {
              queryGeoInfoByAddress(geoAddressQueryRequest: $geoAddressQueryRequest) {
                country
                lat
                lng
                label
                municipality
                region
              }
            }
          `,
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
        setError('Failed to fetch suggestions');
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

  const handleSelect = (location) => {
    setInputValue(location.label);
    setSuggestions([]);
    onLocationSelect({
      name: location.label,
      lat: location.lat,
      lng: location.lng,
      region: location.region,
      municipality: location.municipality,
    });
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={`${styles.searchContainer} ${isFocused ? styles.focused : ''}`}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${styles.input} ${compact ? styles.compactInput : ''}`}
          aria-label="City search"
        />
        
        {(isLoading || error) && (
          <div className={styles.statusIndicator}>
            {isLoading ? (
              <div className={styles.spinner} />
            ) : error ? (
              <svg
                className={styles.errorIcon}
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {suggestions.length > 0 && isFocused && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((location, index) => (
            <li
              key={`${location.label}-${index}`}
              onMouseDown={() => handleSelect(location)}
              className={styles.suggestionItem}
            >
              <div className={styles.locationLabel}>{location.label}</div>
              <div className={styles.locationDetails}>
                {location.municipality && <span>{location.municipality}, </span>}
                {location.region}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};