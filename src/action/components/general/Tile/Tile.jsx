import { LocationIcon, Next } from "../../../svgs/Svg";
import { TileNav } from "./TileNav";
import { TileIcon } from "./TileIcon";
import { TileContent } from "./TileContent";
import styles from "./css/Tile.module.css";

export function Tile({tile}) {
  return (
    <div className={styles.tile}>
        <TileIcon icon={<LocationIcon height={24} width={24}/>} />
        <TileContent title={tile.title} description={tile.description} />
        <TileNav icon={<Next height={24} width={24} />} />
    </div>
  )
}
