import styles from "./css/ToggleButton.module.css";

export const ToggleButton = ({ isActive, onClick }) => (
  <div
    className={styles.toggleWrapper}
    onClick={onClick}
    role="button"
    aria-pressed={isActive}
    tabIndex={0}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
  >
    <span className={styles.toggleText}>
      {isActive ? "Stop Job Search" : "Start Job Search"}
    </span>
    <div
      className={`${styles.toggleContainer} ${isActive ? styles.active : ""}`}
    >
      <div className={styles.toggleCircle}></div>
    </div>
  </div>
);
