import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const DEFAULT_APP_DATA = {
  centerOfCityCoordinates: null,
  commuteDistance: 35,
  otherCities: [],
  shiftPriorities: ["Flex", "Full", "Part", "Reduced"]
};

const STORAGE_KEY = 'appData';

export const AppContextProvider = ({ children }) => {
  const [appData, setAppData] = useState(DEFAULT_APP_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage and sync with service worker
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const initialData = savedData ? JSON.parse(savedData) : DEFAULT_APP_DATA;

        // Migration for centerOfCityCoordinates
        if (initialData.centerOfCityCoordinates === '') {
          initialData.centerOfCityCoordinates = null;
        }

        setAppData(initialData);

        // Initialize service worker state
        chrome.runtime.sendMessage({
          type: "INIT_APP_DATA",
          payload: initialData
        });
      } catch (error) {
        console.error('Failed to load app data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();

    // Listen for external updates
    const handleMessage = (msg) => {
      if (msg.type === "APP_DATA_UPDATE" && msg.timestamp > appData.timestamp) {
        setAppData(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Save data to localStorage and broadcast changes
  useEffect(() => {
    if (!isLoaded) return;

    // Check if data actually changed
    const prevData = JSON.parse(localStorage.getItem(STORAGE_KEY) || DEFAULT_APP_DATA);
    const hasChanged = JSON.stringify(prevData) !== JSON.stringify(appData);

    if (hasChanged) {
      const update = {
        ...appData,
        timestamp: Date.now()
      };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(update));
      chrome.runtime.sendMessage({
        type: "UPDATE_APP_DATA",
        payload: update
      });
    } catch (error) {
      console.error('Failed to save app data:', error);
    }
  }}, [appData, isLoaded]);

  const updateAppData = (newData) => {
    setAppData(prev => ({
      ...prev,
      ...newData,
      timestamp: Date.now()
    }));
  };

  return (
      <AppContext.Provider value={{ appData, updateAppData, isLoaded }}>
        {isLoaded ? children : <div className="loading">Loading...</div>}
      </AppContext.Provider>
  );
};