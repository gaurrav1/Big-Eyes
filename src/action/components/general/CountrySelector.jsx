import React, { useState } from 'react';
import styles from './css/CountrySelector.module.css';

export const CountrySelector = () => {
    const [selectedCountry, setSelectedCountry] = useState(null);

    return (
        <div className={styles.container}>
            <div className={styles.cardContainer}>
                {['Canada', 'USA'].map(country => (
                    <div
                        key={country}
                        className={
                            selectedCountry === country
                                ? styles.cardSelected
                                : styles.card
                        }
                        onClick={() => setSelectedCountry(country)}
                    >
                        <div className={styles.neonGlow} />

                        <img
                            src={`/${country.toLowerCase()}-flag.jpg`} // Replace with your flag images
                            alt={`${country} flag`}
                            className={styles.flag}
                        />

                        <h2 className={styles.countryName}>{country}</h2>

                        <div className={styles.selectionIndicator}>
                            <div className={styles.checkIcon}>✓</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};