import React, { useRef } from 'react';
import styles from './Main.module.css';
import { LocationIcon, CalendarIcon, HeartIcon } from '../../svgs/Svg';
import { ShiftPickerModal } from '../../components/ShiftPickerModel';
import { Link, Navigate } from 'react-router-dom';
import { FormField } from '../../components/general/FormField';
import { ToggleButton } from '../../components/general/ToggleButton';

export const Main = () => {
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
    <Navigate to="/location" replace={true} />;
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
    <>
      <div className={styles.container}>
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
              options={['Any shifts', 'Flex time', 'Part time', 'Full time', 'Reduced time']}
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
    </>
  );
};