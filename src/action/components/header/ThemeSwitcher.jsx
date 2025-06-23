import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./css/ThemeSwitcher.module.css";
import { useTheme, THEMES } from "../../context/ThemeContext";
import { Contrast, Moon, Sun, Close } from "../../svgs/Svg";

export const ThemeSwitcher = () => {
  const { themePreference, setThemePreference } = useTheme();
  const [open, setOpen] = useState(false);
  const prevThemeRef = useRef(themePreference);

  const themes = useMemo(() => [
    THEMES.LIGHT,
    THEMES.DARK,
    THEMES.SYSTEM
  ], []);

  const icons = useMemo(() => ({
    [THEMES.LIGHT]: <Sun width={25} height={25} />,
    [THEMES.DARK]: <Moon width={25} height={25} />,
    [THEMES.SYSTEM]: <Contrast width={25} height={25} />,
  }), []);

  const labels = useMemo(() => ({
    [THEMES.LIGHT]: <> Light<br />Mode </>,
    [THEMES.DARK]: <>Dark<br />Mode</>,
    [THEMES.SYSTEM]: <>System<br />default</>,
  }), []);

  useEffect(() => {
    if (prevThemeRef.current !== themePreference) {
      setOpen(false);
      prevThemeRef.current = themePreference;
    }
  }, [themePreference]);

  const handleClick = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const handleThemeSelect = useCallback((theme) => {
    setThemePreference(theme);
  }, [setThemePreference]);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.mainBtn}
        onClick={handleClick}
        aria-label="Theme Switcher"
      >
        {open ? (
          <>
            <span className={styles.label}>Close</span>
            <span className={styles.icon}><Close width={28} height={28} /></span>
          </>
        ) : (
          <>
            <span className={styles.icon}>{icons[themePreference]}</span>
            <span className={styles.label}>{labels[themePreference]}</span>
          </>
        )}
      </button>

      {open && (
        <div className={styles.slider}>
          {themes.map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeSelect(theme)}
              className={`${styles.btn} ${themePreference === theme ? styles.active : ''}`}
              title={labels[theme]}
              aria-label={`Switch to ${labels[theme]}`}
            >
              <span className={styles.icon}>{icons[theme]}</span>
              <span className={styles.label}>{labels[theme]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ThemeSwitcher);