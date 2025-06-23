import styles from './Location.module.css'
import {CommuteSlider} from '../../components/slider/CommuteSlider.jsx'

export const Location = () => {
  const handleDistanceChange = (distance) => {
    console.log('Selected distance:', distance);
    // Use the distance in your calculations
  };
  return (
    <div className={styles.container}>

      <h2>Commute Distance</h2>
      <CommuteSlider initialValue={35} onChange={handleDistanceChange} />
    </div>
  );
};