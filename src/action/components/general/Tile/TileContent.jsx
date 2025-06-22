import styles from './css/TileContent.module.css';

export function TileContent({title, description}) {
  return (
    <div className={styles.tileContent}>

        <div className={styles.tileTitle}>
            {title}
        </div>

        <div className={styles.tileDescription}>
            {description}
        </div>

    </div>
  )
}
