import React, { useEffect, useState, useRef } from "react";
import styles from "./UserStatus.module.css";

const STATUS_LABELS = {
  thisTab: { text: "Fetching: ON (this tab)", className: styles.statusOn },
  otherTab: {
    text: "Fetching: ON (other tab)",
    className: styles.statusOtherTab,
  },
  off: { text: "Fetching: OFF", className: styles.statusOff },
  error: { text: "Network Error", className: styles.statusError },
};

export const UserStatus = () => {
  const [preferences, setPreferences] = useState({
    location: "Unknown",
    shiftPriorities: [],
    shiftPrioritized: false,
    cityPrioritized: false,
  });
  const [status, setStatus] = useState("off");
  const tabIdRef = useRef(null);

  // Get this tab's id on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (res) => {
      tabIdRef.current = res?.tabId;
      queryTabStatus();
    });
  }, []);

  // Helper to query the current tab's fetching status
  const queryTabStatus = () => {
    chrome.runtime.sendMessage({ type: "GET_TAB_STATE" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("off");
        return;
      }
      // Compare tab ids
      if (res?.isActive) {
        if (res.activeTabId === tabIdRef.current) {
          setStatus("thisTab");
        } else {
          setStatus("otherTab");
        }
      } else {
        setStatus("off");
      }
    });
  };

  useEffect(() => {
    function handleMsg(msg) {
      if (msg.type === "APP_DATA_UPDATE") {
        setPreferences({
          location: msg.payload?.location || "Unknown",
          shiftPriorities: msg.payload?.shiftPriorities || [],
          shiftPrioritized: msg.payload?.shiftPrioritized || false,
          cityPrioritized: msg.payload?.cityPrioritized || false,
        });
      }
      if (msg.type === "TAB_STATE_UPDATE") {
        queryTabStatus();
      }
      if (msg.type === "NETWORK_ERROR") {
        setStatus("error");
      }
    }
    chrome.runtime.onMessage.addListener(handleMsg);

    // Initial fetch from storage and tab state
    chrome.storage.local.get(["appData"], (result) => {
      setPreferences({
        location: result.appData?.location || "Unknown",
        shiftPriorities: result.appData?.shiftPriorities || [],
        shiftPrioritized: result.appData?.shiftPrioritized || false,
        cityPrioritized: result.appData?.cityPrioritized || false,
      });
    });

    // Only query status if tabId is already set
    if (tabIdRef.current !== null) {
      queryTabStatus();
    }

    return () => chrome.runtime.onMessage.removeListener(handleMsg);
    // eslint-disable-next-line
  }, []);

  // Update tab title on status change
  useEffect(() => {
    const base = document.title.replace(/(\[.*?\]\s*)?/, "");
    let prefix = "";
    if (status === "thisTab") prefix = "[⏳ ON] ";
    else if (status === "otherTab" || status === "off") prefix = "[⏹ OFF] ";
    else if (status === "error") prefix = "[⚠️ ERROR] ";
    document.title = prefix + base;
  }, [status]);

  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.off;

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusRow}>
        <span className={statusLabel.className}>{statusLabel.text}</span>
      </div>
      <div className={styles.statusRow}>
        <span>Location:</span>
        <b>
          {Array.isArray(preferences.location?.otherCities)
            ? preferences.location.otherCities.map((otherCity, idx) => (
                <div key={idx}>{otherCity}</div>
              ))
            : preferences.location}
        </b>
      </div>
      <div className={styles.statusRow}>
        <span>Shift Priority:</span>
        <ol className={styles.shiftList}>
          {preferences.shiftPriorities.length === 0 ? (
            <li>Any</li>
          ) : (
            preferences.shiftPriorities.map((shift, i) => (
              <li key={shift}>{shift}</li>
            ))
          )}
        </ol>
      </div>
      <div className={styles.statusRow}>
        <span>Shift Priority Mode:</span>
        <b>{preferences.shiftPrioritized ? "Strict Order" : "Any Match"}</b>
      </div>
      <div className={styles.statusRow}>
        <span>City Priority Mode:</span>
        <b>{preferences.cityPrioritized ? "Strict Order" : "Any Match"}</b>
      </div>
    </div>
  );
};
