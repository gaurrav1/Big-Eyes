import { useTheme } from "../../context/ThemeContext";

export const ThemeSwitcher = () => {
  const { themePreference, toggleTheme } = useTheme();
  const styles = {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: 'var(--fg)'
  };

  // Get appropriate icon based on preference
  const getThemeIcon = () => {
    switch(themePreference) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '🌓'; // System icon
      default: return '🌓';
    }
  };

  return (
    <div className="theme-btn">
      <button onClick={toggleTheme} style={styles}>
        {getThemeIcon()}
      </button>
    </div>
  );
};