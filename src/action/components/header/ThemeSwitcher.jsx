import { useTheme } from "../../context/ThemeContext";

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const styles = {
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        color: 'var(--fg)'
    };

    return (
        <button onClick={toggleTheme} className={styles}>
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};