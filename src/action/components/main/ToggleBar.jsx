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

  const toggleSearch = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const newState = !isSearching;
      // Only send message if tab URL matches your content script's pattern
      if (
        activeTab.url &&
        activeTab.url.startsWith("https://hiring.amazon.ca/")
      ) {
        chrome.tabs.sendMessage(
          activeTab.id,
          {
            type: "TOGGLE_FETCHING",
            isActive: newState,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
            }
          },
        );
        setIsSearching(newState); // Only toggle if valid tab
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
    // Toggle ON after choosing location
    setIsSearching(true);
    chrome.runtime.sendMessage({
      type: "TOGGLE_FETCHING",
      isActive: true,
    });
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      // Only send message if tab URL matches your content script's pattern
      if (tab.url && tab.url.startsWith("https://hiring.amazon.ca/")) {
        chrome.tabs.sendMessage(tab.id, { type: "GET_TAB_STATE" }, (res) => {
          if (chrome.runtime.lastError) {
            // Optionally log or ignore
            console.warn(
              "No content script in this tab:",
              chrome.runtime.lastError.message,
            );
            setIsSearching(false); // fallback
            return;
          }
          setIsSearching(res?.isActive || false);
        });
      }
    });

    // Listen to updates
    const listener = (msg) => {
      if (msg.type === "TAB_STATE_UPDATE") {
        setIsSearching(msg.isActive);
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
