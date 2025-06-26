// src/action/components/general/ToggleButton.jsx
import styles from "./css/ToggleButton.module.css";

export const ToggleButton = ({ isActive, onClick, title }) => (
  <div>
    {title && <div className={styles.toggleTitle}>{title}</div>}
    <div
      className={styles.toggleWrapper}
      onClick={onClick}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <span className={styles.toggleText}>
        {isActive ? "Stop Searching For Jobs" : "Start Searching For Jobs"}
      </span>
      <div
        className={`${styles.toggleContainer} ${isActive ? styles.active : ""}`}
      >
        <div className={styles.toggleCircle}></div>
      </div>
    </div>
  </div>
);
