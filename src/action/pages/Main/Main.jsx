import React, { useEffect, useState } from 'react';
import {useAppContext} from "../../context/AppContext.jsx";
import {ToggleButton} from "../../components/general/ToggleButton.jsx";
import {Lists} from "../../components/main/Lists.jsx";

export const Main = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { appData, isLoaded } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check current fetching status
    chrome.runtime.sendMessage(
        { type: "GET_FETCH_STATUS" },
        (response) => setIsSearching(response?.isActive || false)
    );

    // Listen for status changes
    const handleStatusChange = (msg) => {
      if (msg.type === "FETCH_STATUS_UPDATE") {
        setIsSearching(msg.isActive);
      }
    };

    chrome.runtime.onMessage.addListener(handleStatusChange);
    return () => chrome.runtime.onMessage.removeListener(handleStatusChange);
  }, []);

  const toggleSearch = () => {
    const newState = !isSearching;
    chrome.runtime.sendMessage({
      type: "TOGGLE_FETCHING",
      isActive: newState
    }, (response) => {
      if (response?.success) {
        setIsSearching(newState);
      } else {
        console.error("Failed to toggle fetching");
        // Revert UI state if failed
        setIsSearching(!newState);
      }
    });
  };

  return (
      <div className="container">
        <ToggleButton isActive={isSearching} onClick={toggleSearch} />
        <h3>FILTERS</h3>

        {isClient && isLoaded ? (
            <Lists appData={appData} />
        ) : (
            <div>Loading preferences...</div>
        )}
      </div>
  );
};