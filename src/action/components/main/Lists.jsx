import { Tile } from "../general/Tile/Tile";
import {CalendarIcon, LocationIcon, Next, TimeIcon} from "../../svgs/Svg";
import styles from "./css/Lists.module.css";
import { Divider } from "../general/Divider";
import { SHIFT_LABELS } from "../../constants/shifts";

export function Lists({ appData }) {
  const {
    centerOfCityCoordinates,
    commuteDistance,
    otherCities,
    shiftPriorities,
  } = appData || {};

  // Compose title (with fallback)
  const locationTitle =
    centerOfCityCoordinates?.locationName && commuteDistance
      ? `${centerOfCityCoordinates.locationName} ~ ${commuteDistance} km`
      : "Location";

  // Compose description (first names, or fallback)
  const locationDescription =
    Array.isArray(otherCities) && otherCities.length > 0
      ? otherCities.map((city) => city.name.split(",")[0]).join(", ")
      : "Any nearby location";

  const shiftTitle =
    shiftPriorities && shiftPriorities.length > 0
      ? SHIFT_LABELS[shiftPriorities[0]] || shiftPriorities[0]
      : "Shift Type";

  const shiftDescription =
    Array.isArray(shiftPriorities) && shiftPriorities.length > 0
      ? shiftPriorities
          .map((key) => {
            // Get label, fallback to key if not found
            const label = SHIFT_LABELS[key] || key;
            // Only first word, capitalize first letter, rest lowercase
            const firstWord = label.split(" ")[0];
            return (
              firstWord.charAt(0).toUpperCase() +
              firstWord.slice(1).toLowerCase()
            );
          })
          .join(" > ")
      : "Select a shift type";

  const locationTile = {
    icon: <LocationIcon height={30} width={30} />,
    title: locationTitle,
    description: locationDescription,
    navIcon: <Next height={30} width={30} />,
    locate: "/location",
  };
  const shiftTypeTile = {
    icon: <TimeIcon height={26} width={26} />,
    title: shiftTitle,
    description: shiftDescription,
    navIcon: <Next height={30} width={30} />,
    locate: "/shifts",
  };

  return (
    <div className={styles.lists}>
      <Tile tile={locationTile} />
      <Divider />
      <Tile tile={shiftTypeTile} />
    </div>
  );
}
