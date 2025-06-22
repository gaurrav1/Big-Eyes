import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './css/ThemeSwitcher.module.css';
import { Moon } from "../../static/svg/Moon.jsx";
import { Sun } from "../../static/svg/Sun.jsx";
import { Contrast } from "../../static/svg/Contrast.jsx";
import { Close } from "../../static/svg/Close.jsx";
import React from 'react';

const themes = ['light', 'dark', 'contrast'];

const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const prevThemeRef = useRef(theme);

    const icons = useMemo(() => ({
        light: <Sun width={30} height={30} />,
        dark: <Moon width={28} height={28} />,
        contrast: <Contrast width={30} height={30} />,
    }), []);

    const labels = useMemo(() => ({
        light: 'Light Mode',
        dark: 'Dark Mode',
        contrast: 'High Contrast',
    }), []);

    useEffect(() => {
        if (prevThemeRef.current !== theme) {
            setOpen(false);
            prevThemeRef.current = theme;
        }
    }, [theme]);

    const handleClick = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    const handleThemeSelect = useCallback((th) => {
        setTheme(th);
    }, [setTheme]);

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
                        <span className={styles.icon}>{icons[theme]}</span>
                        <span className={styles.label}>{labels[theme]}</span>
                    </>
                )}
            </button>

            {open && (
                <div className={styles.slider}>
                    {themes.map((th) => (
                        <button
                            key={th}
                            onClick={() => handleThemeSelect(th)}
                            className={`${styles.btn} ${theme === th ? styles.active : ''}`}
                            title={labels[th]}
                            aria-label={`Switch to ${labels[th]}`}
                        >
                            <span className={styles.icon}>{icons[th]}</span>
                            <span className={styles.label}>{labels[th]}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(ThemeSwitcher);
