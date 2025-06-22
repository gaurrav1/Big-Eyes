import styles from './css/FormField.module.css';

export const FormField = ({ icon, label, onClick, value, children }) => (
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