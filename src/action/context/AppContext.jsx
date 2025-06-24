import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // Optimized data loading
  const loadData = useCallback(async () => {
    try {
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || DEFAULT_APP_DATA);
      const initialData = {
        ...DEFAULT_APP_DATA,
        ...savedData,
        centerOfCityCoordinates: savedData.centerOfCityCoordinates || null
      };

      setAppData(initialData);

      chrome.runtime.sendMessage({
        type: "INIT_APP_DATA",
        payload: initialData
      });
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Data persistence
  const saveData = useCallback((data) => {
    const update = { ...data, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(update));
    chrome.runtime.sendMessage({
      type: "UPDATE_APP_DATA",
      payload: update
    });
  }, []);

  // Initialization
  useEffect(() => {
    loadData();

    const handleMessage = (msg) => {
      if (msg.type === "APP_DATA_UPDATE" && msg.timestamp > (appData.timestamp || 0)) {
        setAppData(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [loadData]);

  // Efficient data updates
  const updateAppData = useCallback((newData) => {
    setAppData(prev => {
      const merged = { ...prev, ...newData, timestamp: Date.now() };

      // Prevent unnecessary saves
      if (JSON.stringify(prev) !== JSON.stringify(merged)) {
        saveData(merged);
      }

      return merged;
    });
  }, [saveData]);

  return (
      <AppContext.Provider value={{
        appData,
        updateAppData,
        isLoaded
      }}>
        {children}
      </AppContext.Provider>
  );
};