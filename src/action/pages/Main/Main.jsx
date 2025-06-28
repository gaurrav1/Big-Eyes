import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { Lists } from "../../components/main/Lists.jsx";
import {ToggleBar} from "../../components/main/ToggleBar.jsx";
import {Section} from "../../components/general/Section.jsx";

export const Main = () => {
  const { appData } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filterHeader = {
      title: "Filters",
      fontSize: "H4"
  }

  return (
    <div className="container">
        <ToggleBar appData={appData}/>
        <Section header={filterHeader}>
            {isClient ? (
                <Lists appData={appData} />
            ) : (
                <div>Loading preferences...</div>
            )}
        </Section>
    </div>
  );
};
