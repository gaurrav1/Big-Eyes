import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { Lists } from "../../components/main/Lists.jsx";
import {ToggleBar} from "../../components/main/ToggleBar.jsx";

export const Main = () => {
  const { appData, isLoaded } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="container">
     <ToggleBar appData={appData}/>

      <h3>FILTERS</h3>

      {isClient && isLoaded ? (
        <Lists appData={appData} />
      ) : (
        <div>Loading preferences...</div>
      )}


    </div>
  );
};
