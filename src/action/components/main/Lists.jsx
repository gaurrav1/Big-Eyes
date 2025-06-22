import { Tile } from "../general/Tile/Tile";
import { CalendarIcon, LocationIcon, Next } from "../../svgs/Svg";
import styles from "./css/Lists.module.css";

export function Lists() {

  const locationTile = {
    icon: <LocationIcon height={50} width={50} />,
    title: "Location",
    description: "Select a location",
    navIcon: <Next height={30} width={30} />,
    locate: '/location',
    iconStyle: {
      backgroundColor: "#E0F7FA",
      color: "#00796B"
    }
  };
  const shiftTypeTile = {
    icon: <CalendarIcon height={50} width={50} />,
    title: "Shift Type",
    description: "Select a shift type",
    navIcon: <Next height={30} width={30} />,
    locate: '/shifts',
    iconStyle: {
      backgroundColor: "#FFF3E0",
      color: "#E65100"
    }
  };

  return (
    <div className={styles.lists}>
      <Tile tile={locationTile} />
      <div className={styles.divider} />
      <Tile tile={shiftTypeTile} />
    </div>
  );
}
