import {useEffect, useMemo, useState} from "react";
import { ToggleButton } from "../general/ToggleButton.jsx";
import { WarningText } from "../general/WarningText.jsx";

export function ToggleBar({
  appData,
  setShowLocationDialog,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [countryCode, setCountryCode] = useState('CA');

  // Get dynamic URL based on country
  const countryUrl = useMemo(() =>
          countryCode.toLowerCase() === "ca"
              ? "https://hiring.amazon.ca/"
              : "https://hiring.amazon.com/",
      [countryCode]);

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

  // Query the active tab for its state
  const queryActiveTabState = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.startsWith(countryUrl)) {
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
      if (activeTab.url && activeTab.url.startsWith(countryUrl)) {
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

  function queryActiveCountryCode() {
    chrome.runtime.sendMessage({type: "GET_COUNTRY"})
        .then((res) => {
          setCountryCode(res.country);
        });
  }

  useEffect(() => {
    queryActiveTabState();
    queryActiveCountryCode();

    // Listen to updates
    const listener = ({type, message}) => {
      if (type === "TAB_STATE_UPDATE") {
        queryActiveTabState();
      }
      if (type === "COUNTRY_CHANGE_UPDATE") {
        setCountryCode(message?.country);
      }
      return true;
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div>
      <ToggleButton isActive={isSearching} onClick={toggleSearch} />
      {toggleError && <WarningText text={toggleError} isError={true} />}
    </div>
  );
}
