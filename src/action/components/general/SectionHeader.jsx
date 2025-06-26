import styles from './css/SectionHeader.module.css'


export function SectionHeader({ title, buttonHandler, disabled, buttonName }) {
    return (
        <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
                {title}
            </div>

            <div className={styles.sectionButtonContainer}>
                <button
                    className={styles.sectionButton}
                    onClick={buttonHandler}
                    disabled={disabled}
                >
                    {buttonName}
                </button>
            </div>
        </div>
    )
}
