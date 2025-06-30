import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToggleButton } from "../general/ToggleButton.jsx";
import { WarningText } from "../general/WarningText.jsx";
import { ConfirmationDialog } from "../dialog/ConfirmationDialog.jsx";
import styles from "./css/ToggleBar.module.css";

const country = "https://hiring.amazon.com/";

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

  // Query the active tab for its state
  const queryActiveTabState = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.startsWith(country)) {
        chrome.tabs.sendMessage(tab.id, { type: "GET_TAB_STATE" }, (res) => {
          if (chrome.runtime.lastError) {
            setIsSearching(false);
            return;
          }
          setIsSearching(res?.isActive || false);
        });
      } else {
        setIsSearching(false);
      }
    });
  };

  const toggleSearch = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const newState = !isSearching;
      // Only send message if tab URL matches your content script's pattern
      if (activeTab.url && activeTab.url.startsWith(country)) {
        chrome.runtime.sendMessage(
          {
            type: "TOGGLE_FETCHING",
            isActive: newState,
            tabId: activeTab.id,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
            }
            // After toggling, re-query the tab state to update the UI
            queryActiveTabState();
          },
        );
        setToggleError(""); // Clear any previous error

        if (newState && shouldShowLocationDialog()) {
          setShowLocationDialog(true);
        }
      } else {
        setToggleError(
          "Please open the Amazon Hiring website to search for jobs.",
        );
        setIsSearching(false);
      }
    });
  };

  // Handle dialog confirm
  const handleChooseLocation = () => {
    setShowLocationDialog(false);
    navigate("/location");
  };

  useEffect(() => {
    queryActiveTabState();

    // Listen to updates
    const listener = (msg) => {
      if (msg.type === "TAB_STATE_UPDATE") {
        queryActiveTabState();
      }
      return true;
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
