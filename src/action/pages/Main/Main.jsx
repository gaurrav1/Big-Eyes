import React from 'react';
import styles from './Main.module.css';
import { Link, Navigate } from 'react-router-dom';
import { ToggleButton } from '../../components/general/ToggleButton';
import { Lists } from '../../components/main/Lists';

export const Main = () => {
  const [isSearching, setIsSearching] = React.useState(false);

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      chrome.storage.local.set({
        filters: {
          // location: locationRef.current,
          // shiftType: shiftTypeRef.current
        }
      });
    }
  };

  return (
    <div className={styles.container}>

      <ToggleButton
        isActive={isSearching}
        onClick={toggleSearch}
      />

      <h3 className={styles.title}>FILTERS</h3>
      <Lists />
    
      
    </div>
  );
};