import React, { useEffect, useState } from "react";
import styles from "./UserStatus.module.css";

const STATUS_LABELS = {
  on: { text: "Fetching: ON", className: styles.statusOn },
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

  // Listen for messages from background/content scripts
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
      if (msg.type === "FETCH_STATUS_UPDATE") {
        setStatus(msg.isActive ? "on" : "off");
      }
      if (msg.type === "NETWORK_ERROR") {
        setStatus("error");
      }
    }
    chrome.runtime.onMessage.addListener(handleMsg);

    // Initial fetch from storage
    chrome.storage.local.get(["appData", "fetchStatus"], (result) => {
      setPreferences({
        location: result.appData?.location || "Unknown",
        shiftPriorities: result.appData?.shiftPriorities || [],
      });
      setStatus(result.fetchStatus === true ? "on" : "off");
    });

    return () => chrome.runtime.onMessage.removeListener(handleMsg);
  }, []);

  // Update tab title on status change
  useEffect(() => {
    const base = document.title.replace(/(\[.*?\]\s*)?/, "");
    let prefix = "";
    if (status === "on") prefix = "[⏳ ON] ";
    else if (status === "off") prefix = "[⏹ OFF] ";
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
        <b>{preferences.location.otherCities?.map((otherCity) => (
            <div>
              {otherCity}
            </div>
        ))}</b>
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
