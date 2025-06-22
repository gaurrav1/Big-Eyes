import styles from './css/TileIcon.module.css';

export function TileIcon({icon, style}) {
  return (
    <div className={styles.tileIcon} style={style}>
      {icon}
    </div>
  )
}
