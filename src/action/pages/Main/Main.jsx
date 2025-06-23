import React, { useEffect, useState } from 'react';
import styles from './Main.module.css';
import { Link, Navigate } from 'react-router-dom';
import { ToggleButton } from '../../components/general/ToggleButton';
import { Lists } from '../../components/main/Lists';
import { useAppContext } from '../../context/AppContext';

export const Main = () => {
  const [isSearching, setIsSearching] = React.useState(false);

    const { appData, isLoaded } = useAppContext();
    const [isClient, setIsClient] = useState(false);
  
    // Ensure we're running on client after hydration
    useEffect(() => {
      setIsClient(true);
    }, []);

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
      {(!isClient || !isLoaded) ? <div className={styles.loading}>Loading your preferences...</div> : <Lists appData={appData}/>}
      
    </div>
  );
};