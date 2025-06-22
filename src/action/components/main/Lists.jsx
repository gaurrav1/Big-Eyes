import { Tile } from "../general/Tile/Tile";
import { CalendarIcon, LocationIcon, Next } from "../../svgs/Svg";
import styles from "./css/Lists.module.css";

export function Lists() {

  const locationTile = {
    icon: <LocationIcon height={30} width={30} />,
    title: "Location",
    description: "Select a location",
    navIcon: <Next height={30} width={30} />,
    locate: '/location'
  };
  const shiftTypeTile = {
    icon: <CalendarIcon height={30} width={30} />,
    title: "Shift Type",
    description: "Select a shift type",
    navIcon: <Next height={30} width={30} />,
    locate: '/shifts'
  };

  return (
    <div className={styles.lists}>
      <Tile tile={locationTile} />
      <div className={styles.divider} />
      <Tile tile={shiftTypeTile} />
    </div>
  );
}
