import { useEffect } from "react";
import { ToggleButton } from "../../components/button/ToggleButton";
import { useAppContext } from "../../context/AppContext";
import { useState } from "react";
import styles from "./Settings.module.css";
import GlassCountrySelector from "../../components/settings/GlassCountrySelector.jsx";

export function Settings() {
  const { appData, updateAppData } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggleCityPriority = () => {
    updateAppData({ cityPrioritized: !appData.cityPrioritized });
  };

  const handleToggleShiftPriority = () => {
    updateAppData({ shiftPrioritized: !appData.shiftPrioritized });
  };

  if (!isClient) {
    return <div className="loading">Loading your preferences...</div>;
  }

  return (
    <div className={styles.container}>

      <ToggleButton
        isActive={appData.cityPrioritized}
        onClick={handleToggleCityPriority}
        title={"Strict Order for location"}
      />

      <ToggleButton
        isActive={appData.shiftPrioritized}
        onClick={handleToggleShiftPriority}
        title={"Strict Order for Shifts"}
      />

    </div>
  );
}
