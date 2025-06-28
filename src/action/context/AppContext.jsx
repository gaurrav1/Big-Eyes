import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  timestamp: Date.now()
};

const STORAGE_KEY = "appData";

export const AppContextProvider = ({ children }) => {
  const [appData, setAppData] = useState(DEFAULT_APP_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Optimized data loading
  const loadData = useCallback(async () => {
    try {
      setAppData(DEFAULT_APP_DATA);

      await chrome.runtime.sendMessage({
        type: "INIT_APP_DATA",
        payload: DEFAULT_APP_DATA,
      });
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Data persistence
  const saveData = useCallback((data) => {
    chrome.runtime.sendMessage({
      type: "UPDATE_APP_DATA",
      payload: data,
    }).then(r => console.log(r));
  }, []);

  // Initialization
  useEffect(() => {
    // Always request latest state from service worker
    chrome.runtime.sendMessage({ type: "GET_APP_DATA" }, (response) => {
      if (response && response.appData) {
        setAppData({
          ...DEFAULT_APP_DATA,
          ...response.appData
        });
        console.log("Loaded data with SW")
        setIsLoaded(true);
      } else {
        loadData().then(r => console.log("No data found... Default Data loaded", r));
      }
    });

    const handleMessage = (msg) => {
      if (
        msg.type === "APP_DATA_UPDATE" &&
        msg.timestamp > (appData.timestamp || 0)
      ) {
        setAppData(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
    // eslint-disable-next-line
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
    <AppContext.Provider
      value={{
        appData,
        updateAppData,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
