import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToggleButton } from "../general/ToggleButton.jsx";
import { WarningText } from "../general/WarningText.jsx";
import { ConfirmationDialog } from "../dialog/ConfirmationDialog.jsx";
import styles from "./css/ToggleBar.module.css";

export function ToggleBar({ appData }) {
  const [isSearching, setIsSearching] = useState(false);
  const [toggleError, setToggleError] = useState(""); // <-- Add this line
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const navigate = useNavigate();

  // Helper: check if we should show the location warning dialog
  const shouldShowLocationDialog = () => {
    // If user has selected "don't show for 1 day", suppress dialog
    const suppressUntil = localStorage.getItem("suppressLocationDialogUntil");
    if (suppressUntil && Date.now() < Number(suppressUntil)) {
      return false;
    }
    // Show dialog if no center city selected
    return !appData?.centerOfCityCoordinates;
  };

  const handleDontShowFor1Day = () => {
    // Suppress dialog for 1 day
    const oneDay = 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "suppressLocationDialogUntil",
      String(Date.now() + oneDay),
    );
    setShowLocationDialog(false);
  };

  // Add this useEffect to handle actual toggling
  useEffect(() => {
    if (isSearching === undefined) return;

    chrome.runtime.sendMessage(
      {
        type: "TOGGLE_FETCHING",
        isActive: isSearching,
      },
      (response) => {
        if (!response?.success) {
          setToggleError(response?.error || "Failed to toggle search.");
          setIsSearching(!isSearching);
        }
      },
    );
  }, [isSearching]);

  // Fix the toggle function
  const toggleSearch = () => {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {
          type: "TOGGLE_CLICKED",
          payload: { /* your toggle state or command */ }
        });
    });


    const newState = !isSearching;
    setIsSearching(newState);

    // Only show dialog if activating without location
    if (newState && shouldShowLocationDialog()) {
      setShowLocationDialog(true);
    } else {
      // Actually toggle the search state
      chrome.runtime.sendMessage({
        type: "TOGGLE_FETCHING",
        isActive: newState,
      });
    }
  };

  // Handle dialog confirm
  const handleChooseLocation = () => {
    setShowLocationDialog(false);
    navigate("/location");
    // Toggle ON after choosing location
    setIsSearching(true);
    chrome.runtime.sendMessage({
      type: "TOGGLE_FETCHING",
      isActive: true,
    });
  };

  // Fix the useEffect for state sync
  useEffect(() => {
    // Get initial state
    chrome.runtime.sendMessage({ type: "GET_TAB_STATE" }, (state) =>
      setIsSearching(state?.isActive || false),
    );

    // Listen for state changes
    const listener = (msg) => {
      if (msg.type === "TAB_STATE_UPDATE") {
        setIsSearching(msg.tabState?.isActive || false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className={styles.toggleBar}>
      <ToggleButton isActive={isSearching} onClick={toggleSearch} />
      {toggleError && <WarningText text={toggleError} isError={true} />}
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
}
