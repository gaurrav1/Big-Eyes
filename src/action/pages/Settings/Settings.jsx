import { useEffect } from "react";
import { ToggleButton } from "../../components/button/ToggleButton";
import { useAppContext } from "../../context/AppContext";
import { useState } from "react";

export function Settings() {
  const { appData, updateAppData} = useAppContext();
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
    <>
      <div>Settings</div>
      <ToggleButton
        isActive={appData.cityPrioritized}
        onClick={handleToggleCityPriority}
      />
      <ToggleButton
        isActive={appData.shiftPrioritized}
        onClick={handleToggleShiftPriority}
      />
    </>
  );
}
