// src/action/components/general/ToggleButton.jsx
import styles from "./css/ToggleButton.module.css";

export const ToggleButton = ({ isActive, onClick, title = "Strict Order" }) => (
  <div>
    <div
      className={styles.toggleWrapper}
      onClick={onClick}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <span className={styles.toggleText}>{title}</span>
      <div
        className={`${styles.toggleContainer} ${isActive ? styles.active : ""}`}
      >
        <div className={styles.toggleCircle}></div>
      </div>
    </div>
  </div>
);
