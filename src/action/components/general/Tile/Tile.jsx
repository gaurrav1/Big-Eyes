import { TileNav } from "./TileNav";
import { TileIcon } from "./TileIcon";
import { TileContent } from "./TileContent";
import styles from "./css/Tile.module.css";
import { Link } from "react-router-dom";

export function Tile({ tile }) {
  const { icon, title, description, navIcon, locate, iconStyle} = tile;

  return (
    <Link to={locate} className={styles.tileLink}>
    <div className={styles.tile}>
      
      <TileIcon icon={icon} style={iconStyle}/>
      <TileContent title={title} description={description} />
      <TileNav icon={navIcon} />
      
    </div>
    </Link>
  );
};
