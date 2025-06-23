import { useState, useEffect, useRef } from 'react';
import styles from './Location.module.css'
import { LocationIcon, CloseIcon } from '../../svgs/Svg';
import { FormField } from '../../components/general/FormField';
import axios from 'axios';

export const Location = () => {
  const [zipInput, setZipInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commuteDistance, setCommuteDistance] = useState(25);
  const [citiesInput, setCitiesInput] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [citiesSuggestions, setCitiesSuggestions] = useState([]);
  const [showCitiesSuggestions, setShowCitiesSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const citiesInputRef = useRef(null);
  

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql', // Replace with actual API endpoint
        {
          operationName: "queryGeoInfoByAddress",
          variables: {
            geoAddressQueryRequest: {
              address: query,
              countries: ["CAN"]
            }
          },
          query: "query queryGeoInfoByAddress($geoAddressQueryRequest: GeoAddressQueryRequest!) { queryGeoInfoByAddress(geoAddressQueryRequest: $geoAddressQueryRequest) { country lat lng postalCode label municipality region subRegion addressNumber __typename } }"
        },
        {
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuggestions(response.data.data.queryGeoInfoByAddress);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const debouncedFetch = useRef(debounce(fetchSuggestions, 300)).current;

  useEffect(() => {
    if (zipInput) {
      debouncedFetch(zipInput);
    } else {
      setSuggestions([]);
    }
  }, [zipInput, debouncedFetch]);

  const handleLocationSelect = (location) => {
    setZipInput(location.label);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setZipInput(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setZipInput('Unable to get location');
        }
      );
    } else {
      setZipInput('Geolocation not supported');
    }
  };

  const handleCommuteChange = (distance) => {
    setCommuteDistance(distance);
  };

  const handleCitySelect = (city) => {
    if (!selectedCities.includes(city)) {
      setSelectedCities([...selectedCities, city]);
    }
    setCitiesInput('');
    setCitiesSuggestions([]);
  };

  const removeCity = (cityToRemove) => {
    setSelectedCities(selectedCities.filter(city => city !== cityToRemove));
  };

  const handleCitiesInput = (e) => {
    const value = e.target.value;
    setCitiesInput(value);
    
    if (value.trim()) {
      debouncedFetch(value);
      setShowCitiesSuggestions(true);
    } else {
      setCitiesSuggestions([]);
      setShowCitiesSuggestions(false);
    }
  };

  useEffect(() => {
    setCitiesSuggestions(suggestions);
  }, [suggestions]);

  return (
    <div className={styles.container}>
      <FormField icon={<LocationIcon width={16} height={16}/>} label={"location"} onClick={null} value={"location"} children={""} />
      <div className={styles.form}>
        {/* Single Location Input */}
        <div className={styles.fieldset}>
          <div className={styles.legend}>
            <LocationIcon />
            <span>Enter Zipcode or City</span>
          </div>
          <div className={styles.fieldContent}>
            <input
              ref={inputRef}
              type="text"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter zipcode or city"
              className={styles.locationInput}
            />
            <button 
              className={styles.currentLocationButton}
              onClick={handleGetCurrentLocation}
            >
              Use Current Location
            </button>
            
            {showSuggestions && (
              <div className={styles.suggestionsContainer}>
                {isLoading ? (
                  <div className={styles.loading}>Loading...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <div
                      key={item.label}
                      className={styles.suggestionItem}
                      onClick={() => handleLocationSelect(item)}
                    >
                      {item.label}
                    </div>
                  ))
                ) : zipInput ? (
                  <div className={styles.noResults}>No results found</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Commute Distance Slider */}
        <div className={styles.fieldset}>
          <div className={styles.legend}>
            <span>Commute Distance</span>
          </div>
          <div className={styles.fieldContent}>
            <div className={styles.commuteSlider}>
              <div className={styles.sliderValues}>
                {[5, 15, 25, 35, 50, 75, 150].map((value) => (
                  <span 
                    key={value}
                    className={`${styles.sliderValue} ${commuteDistance === value ? styles.active : ''}`}
                    onClick={() => handleCommuteChange(value)}
                  >
                    {value} km
                  </span>
                ))}
              </div>
              <input
                type="range"
                min="5"
                max="150"
                value={commuteDistance}
                onChange={(e) => handleCommuteChange(parseInt(e.target.value))}
                className={styles.sliderInput}
                list="markers"
              />
              <datalist id="markers" className={styles.sliderMarkers}>
                {[5, 15, 25, 35, 50, 75, 150].map((value) => (
                  <option key={value} value={value}></option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Multi-city Selector */}
        <div className={styles.fieldset}>
          <div className={styles.legend}>
            <LocationIcon />
            <span>Select Multiple Cities</span>
          </div>
          <div className={styles.fieldContent}>
            <input
              ref={citiesInputRef}
              type="text"
              value={citiesInput}
              onChange={handleCitiesInput}
              onFocus={() => setShowCitiesSuggestions(true)}
              placeholder="Add cities"
              className={styles.locationInput}
            />
            
            <div className={styles.tokenContainer}>
              {selectedCities.map((city) => (
                <div key={city} className={styles.token}>
                  {city}
                  <button 
                    className={styles.tokenClose}
                    onClick={() => removeCity(city)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
            
            {showCitiesSuggestions && (
              <div className={styles.suggestionsContainer}>
                {isLoading ? (
                  <div className={styles.loading}>Loading...</div>
                ) : citiesSuggestions.length > 0 ? (
                  citiesSuggestions.map((item) => (
                    <div
                      key={item.label}
                      className={styles.suggestionItem}
                      onClick={() => handleCitySelect(item.label)}
                    >
                      {item.label}
                    </div>
                  ))
                ) : citiesInput ? (
                  <div className={styles.noResults}>No results found</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};