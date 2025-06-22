import styles from './css/TileContent.module.css';

export function TileContent({title, description}) {
  return (
    <div className={styles.tileContent}>
        <div className="tileTitle">
            {title}
        </div>
        <div className="tileDescription">
            {description}
        </div>
    </div>
  )
}
