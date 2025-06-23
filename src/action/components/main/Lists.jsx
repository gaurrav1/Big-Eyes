import { Tile } from "../general/Tile/Tile";
import { CalendarIcon, LocationIcon, Next } from "../../svgs/Svg";
import styles from "./css/Lists.module.css";
import { Divider } from "../general/Divider";

export function Lists() {

  const locationTile = {
    icon: <LocationIcon height={30} width={30} />,
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
    icon: <CalendarIcon height={30} width={30} />,
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
      <Divider />
      <Tile tile={shiftTypeTile} />
    </div>
  );
}
