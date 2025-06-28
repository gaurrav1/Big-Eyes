import {
  createContext,
  useContext,
  useState,
  useEffect, useCallback,
} from "react";

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const DEFAULT_APP_DATA = {
  centerOfCityCoordinates: null,
  commuteDistance: 35,
  otherCities: [],
  shiftPrioritized: false, // NEW FIELD
  cityPrioritized: false, // NEW FIELD
  shiftPriorities: ["FLEX_TIME", "FULL_TIME", "PART_TIME", "REDUCED_TIME"],
  timestamp: Date.now(),
};

export const AppContextProvider = ({ children }) => {
  const [appData, setAppData] = useState(DEFAULT_APP_DATA);

  useEffect(() => {
    // Initial data load
    chrome.runtime.sendMessage(
        { type: "GET_APP_DATA" },
        (response) => setAppData(response)
    );

    // Listen for updates
    const listener = (msg) => {
      if (msg.type === "APP_DATA_UPDATE") {
        setAppData(msg.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const saveData = useCallback((data) => {
    chrome.runtime.sendMessage({
      type: "UPDATE_APP_DATA",
      payload: data,
    }).then(r => console.log(r));
  }, []);

  // Efficient data updates
  const updateAppData = useCallback(
      (newData) => {
        setAppData((prev) => {
          const merged = { ...prev, ...newData, timestamp: Date.now() };

          // Prevent unnecessary saves
          if (JSON.stringify(prev) !== JSON.stringify(merged)) {
            saveData(merged);
          }

          return merged;
        });
      },
      [saveData],
  );

  return (
      <AppContext.Provider value={{ appData, updateAppData }}>
        {children}
      </AppContext.Provider>
  );
};