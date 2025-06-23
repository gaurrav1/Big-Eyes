import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const [appData, setAppData] = useState({
    centerOfCityCoordinates: '',
    commuteDistance: 35,
    otherCities: [],
    shiftType: null
  });

  const updateAppData = (newData) => {
    setAppData(prev => ({ ...prev, ...newData }));
  };

  return (
    <AppContext.Provider value={{ appData, updateAppData }}>
      {children}
    </AppContext.Provider>
  );
};