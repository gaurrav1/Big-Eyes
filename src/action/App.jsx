import React, { useRef } from 'react';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import styles from './App.module.css';
import { LocationIcon, CalendarIcon, HeartIcon } from '../svgs/Svg';
import { ShiftPickerModal } from './components/ShiftPickerModel';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <button onClick={toggleTheme} className={styles.themeButton}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

const FormField = ({ icon, label, onClick, value, children }) => (
  <div className={styles.fieldset} role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}>
    <div className={styles.legend}>
      {icon}
      <span>{label}</span>
    </div>
    <div className={styles.fieldContent} onClick={onClick}>
      {value || children}
    </div>
  </div>
);

// const ToggleButton = ({ isActive, onClick }) => (
//   <div className={styles.toggleWrapper}>
//     <div 
//       className={`${styles.toggleContainer} ${isActive ? styles.active : ''}`}
//       onClick={onClick}
//     >
//       <div className={styles.toggleCircle}></div>

//     </div>
//     <span className={styles.toggleText}>{isActive ? "Stop Searching For Jobs" : "Start Searching For Jobs"}</span>
//   </div>
// );
const ToggleButton = ({ isActive, onClick }) => (
  <div className={styles.toggleWrapper} onClick={onClick} role="button"
    aria-pressed={isActive}
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}>
    <span className={styles.toggleText}>
      {isActive ? "Stop Searching For Jobs" : "Start Searching For Jobs"}
    </span>
    <div className={`${styles.toggleContainer} ${isActive ? styles.active : ''}`}>
      <div className={styles.toggleCircle}></div>
    </div>
  </div>
);



export const App = () => {
  const locationRef = useRef(null);
  const shiftTypeRef = useRef(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [formData, setFormData] = React.useState({
    location: '',
    shiftType: ''
  });
  // Add new state for shift picker
  const [showShiftPicker, setShowShiftPicker] = React.useState(false);

  const handleLocationClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('location.html') });
  };

  const handleShiftSelect = (type) => {
    setFormData(prev => ({ ...prev, shiftType: type }));
    shiftTypeRef.current = type;
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      chrome.storage.local.set({
        filters: {
          location: locationRef.current,
          shiftType: shiftTypeRef.current
        }
      });
    }
  };

  return (
    <ThemeProvider>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Amazon Jobs</h1>
          <ThemeSwitcher />
        </div>

        <div className={styles.form}>
          <FormField
            icon={<LocationIcon />}
            label="SELECT LOCATION"
            value={formData.location || 'Set Location'}
            onClick={handleLocationClick}
          />

          <FormField
            icon={<CalendarIcon />}
            label="TYPES OF SHIFT"
            value={formData.shiftType || 'Select Shift Type'}
            onClick={() => setShowShiftPicker(true)}
          />

          {showShiftPicker && (
            <ShiftPickerModal
              options={['Flex time', 'Part time', 'Full time', 'Reduced time']}
              selected={formData.shiftType}
              onSelect={handleShiftSelect}
              onClose={() => setShowShiftPicker(false)}
            />
          )}
        </div>

        <div className={styles.spacer}></div>

        <ToggleButton
          isActive={isSearching}
          onClick={toggleSearch}
        />

        <div className={styles.buttonGroup}>
          <button
            className={styles.actionButton}
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })}
          >
            Settings
          </button>
          <button
            className={styles.actionButton}
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('history.html') })}
          >
            History
          </button>
        </div>

        <div className={styles.footer}>
          Wish you Luck <HeartIcon />
        </div>
      </div>
    </ThemeProvider>
  );
};