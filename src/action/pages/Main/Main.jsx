import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import { ToggleButton } from "../../components/general/ToggleButton.jsx";
import { Lists } from "../../components/main/Lists.jsx";
import { ConfirmationDialog } from "../../components/dialog/ConfirmationDialog";

export const Main = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { appData, isLoaded } = useAppContext();
  const [toggleError, setToggleError] = useState(""); // <-- Add this line
  const [isClient, setIsClient] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsClient(true);

    // Check current fetching status
    chrome.runtime.sendMessage({ type: "GET_SEARCH_STATUS" }, (response) =>
      setIsSearching(response?.isActive || false),
    );

    // Listen for status syncs
    const handleStatusSync = (msg) => {
      if (msg.type === "SEARCH_STATUS_SYNC") {
        setIsSearching(msg.isActive);
      }
    };

    chrome.runtime.onMessage.addListener(handleStatusSync);
    return () => chrome.runtime.onMessage.removeListener(handleStatusSync);
  }, []);

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

  const handleChooseLocation = () => {
    setShowLocationDialog(false);
    navigate("/location");
  };

  const toggleSearch = () => {
    // If not searching and no center city, show dialog
    if (!isSearching && shouldShowLocationDialog()) {
      setShowLocationDialog(true);
      return;
    }

    const newState = !isSearching;
    setIsSearching(newState); // Optimistic update
    setToggleError(""); // Clear previous error

    chrome.runtime.sendMessage(
      {
        type: "TOGGLE_SEARCH",
        isActive: newState,
      },
      (response) => {
        if (!response?.success) {
          setToggleError(response?.error || "Failed to toggle search.");
          setIsSearching(!newState); // Revert on failure
        }
      },
    );
  };

  return (
    <div className="container">
      <ToggleButton isActive={isSearching} onClick={toggleSearch} />
      {toggleError && (
        <div style={{ color: "red", margin: "8px 0" }}>{toggleError}</div>
      )}

      <h3>FILTERS</h3>

      {isClient && isLoaded ? (
        <Lists appData={appData} />
      ) : (
        <div>Loading preferences...</div>
      )}

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
