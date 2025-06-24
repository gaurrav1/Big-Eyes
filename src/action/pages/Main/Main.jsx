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
        { type: "GET_SEARCH_STATUS" },
        (response) => setIsSearching(response?.isActive || false)
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

  const toggleSearch = () => {
    const newState = !isSearching;
    setIsSearching(newState); // Optimistic update

    chrome.runtime.sendMessage({
      type: "TOGGLE_SEARCH",
      isActive: newState
    }, (response) => {
      if (!response?.success) {
        console.error("Toggle failed:", response?.error);
        setIsSearching(!newState); // Revert on failure
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