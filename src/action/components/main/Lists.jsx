import { Tile } from "../general/Tile/Tile";
import { CalendarIcon, LocationIcon, Next } from "../../svgs/Svg";
import styles from "./css/Lists.module.css";
import { Divider } from "../general/Divider";

export function Lists({appData}) {

    const { centerOfCityCoordinates, commuteDistance, otherCities, shiftPriorities } = appData || {};

  // Compose title (with fallback)
  const locationTitle =
    centerOfCityCoordinates?.name && commuteDistance
      ? `${centerOfCityCoordinates.name} - ${commuteDistance} km`
      : "Location";

  // Compose description (first names, or fallback)
  const locationDescription =
    Array.isArray(otherCities) && otherCities.length > 0
      ? otherCities.map(city => city.name.split(',')[0]).join(', ')
      : "Select a location";

  const shiftTitle = shiftPriorities[0] + " Time";

  const shiftDescription =
      Array.isArray(shiftPriorities) && shiftPriorities.length > 0
      ?  shiftPriorities.join(' > ') : "Select a shift type";

  const locationTile = {
    icon: <LocationIcon height={30} width={30} />,
    title: locationTitle,
    description: locationDescription,
    navIcon: <Next height={30} width={30} />,
    locate: '/location',
    iconStyle: {
      backgroundColor: "#E0F7FA",
      color: "#00796B"
    }
  };
  const shiftTypeTile = {
    icon: <CalendarIcon height={30} width={30} />,
    title: shiftTitle,
    description: shiftDescription,
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
