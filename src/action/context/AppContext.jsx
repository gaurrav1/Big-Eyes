import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Default app data structure
const DEFAULT_APP_DATA = {
  centerOfCityCoordinates: null,
  commuteDistance: 35,
  otherCities: [],
  shiftType: null
};

// Key for localStorage
const STORAGE_KEY = 'appData';

export const AppContextProvider = ({ children }) => {
  const [appData, setAppData] = useState(DEFAULT_APP_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Migration step for centerOfCityCoordinates
        if (parsedData.centerOfCityCoordinates === '') {
          parsedData.centerOfCityCoordinates = null;
        }
        
        setAppData({
          ...DEFAULT_APP_DATA,
          ...parsedData
        });
      }
    } catch (error) {
      console.error('Failed to load app data from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      } catch (error) {
        console.error('Failed to save app data to localStorage:', error);
      }
    }
  }, [appData, isLoaded]);

  const updateAppData = (newData) => {
    setAppData(prev => ({ ...prev, ...newData }));
  };

  return (
    <AppContext.Provider value={{ appData, updateAppData, isLoaded }}>
      {isLoaded ? children : <div className="loading-indicator">Loading preferences...</div>}
    </AppContext.Provider>
  );
};