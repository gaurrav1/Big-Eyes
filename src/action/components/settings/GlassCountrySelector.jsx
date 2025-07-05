import React, {useCallback, useEffect, useState} from "react";
import styles from "./css/GlassCountrySelector.module.css";
import {CanadaFlag, UsaFlag} from "./CountryFlags.jsx";

const COUNTRIES = [
  {
    code: "CA",
    name: "Canada",
    Flag: CanadaFlag,
  },
  {
    code: "US",
    name: "USA",
    Flag: UsaFlag,
  },
];

export default function GlassCountrySelector({className = "",}) {

  const [selected, setSelected] = useState("CA");

  useEffect(() => {
    chrome.runtime.sendMessage({type: "GET_COUNTRY"})
        .then((res) => {
          setSelected(res.country);
        });
  }, []);

  const handleSelect = useCallback((code) => {
    if (code === selected) return;

    setSelected(code);
    chrome.runtime.sendMessage({
      type: "COUNTRY_CHANGE_ACTION",
      country: code
    }).catch(console.error);
  }, [selected]);


  return (
    <div className={`${styles.glassContainer} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>Choose Your Country</span>
      </div>
      <div className={styles.flagGrid}>
        {COUNTRIES.map(({ code, name, Flag }) => (
          <button
            key={code}
            className={`${styles.flagCard} ${
              selected === code ? styles.selected : ""
            }`}
            onClick={() => handleSelect(code)}
            aria-pressed={selected === code}
            aria-label={name}
            type="button"
          >
            <div className={styles.flagWrapper}>
              <Flag width={72} height={72} />
            </div>
            <span className={styles.countryName}>{name}</span>
            {selected === code && (
              <span className={styles.checkmark} aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
