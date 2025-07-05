import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { Lists } from "../../components/main/Lists.jsx";
import { ToggleBar } from "../../components/main/ToggleBar.jsx";
import { Section } from "../../components/general/Section.jsx";
import { ConfirmationDialog } from "../../components/dialog/ConfirmationDialog.jsx";
import { useNavigate } from "react-router-dom";
import styles from "./Main.module.css";

export const Main = () => {
  const { appData } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  // Dialog state for location preference
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const navigate = useNavigate();

  const handleChooseLocation = () => {
    setShowLocationDialog(false);
    navigate("/location");
  };

  const handleDontShowFor1Day = () => {
    const oneDay = 24 * 60 * 60 * 1000;
    localStorage.setItem(
        "suppressLocationDialogUntil",
        String(Date.now() + oneDay),
    );
    setShowLocationDialog(false);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filterHeader = {
    title: "Filters",
    fontSize: "H4",
  };

  return (
      <div className={styles.container}>
        <ToggleBar
            appData={appData}
            showLocationDialog={showLocationDialog}
            setShowLocationDialog={setShowLocationDialog}
        />
        <Section header={filterHeader}>
          {isClient ? (
              <Lists appData={appData} />
          ) : (
              <div>Loading preferences...</div>
          )}
        </Section>
        <ConfirmationDialog
            isOpen={showLocationDialog}
            title="Select a Location Preference"
            message="You have not selected a center city. If you continue, jobs will be picked randomly from all over Canada. Would you like to choose a location?"
            confirmText="Choose Location"
            cancelText="Don't show for 1 day"
            onConfirm={handleChooseLocation}
            onCancel={handleDontShowFor1Day}
        />
      </div>
  );
};