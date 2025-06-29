import { useState } from "react";
import styles from "./ShiftPreference.module.css";
import { useAppContext } from "../../context/AppContext";
import { PrioritizedList } from "../common/PrioritizedList.jsx";
import { SHIFT_LABELS, SHIFT_KEYS } from "../../constants/shifts";
import { ToggleButton } from "../button/ToggleButton";

const ShiftPreference = () => {
  const { appData, updateAppData } = useAppContext();
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const totalShifts = SHIFT_KEYS;

  const selectedShifts = appData.shiftPriorities || SHIFT_KEYS;

  const availableShifts = totalShifts.filter(
    (shift) => !selectedShifts.includes(shift),
  );

  // Handle adding a shift
  const handleAddShift = (shift) => {
    const newPriorities = [...selectedShifts, shift];
    updateAppData({ shiftPriorities: newPriorities });
    setRecentlyAdded([shift]);
    setTimeout(() => setRecentlyAdded([]), 300);
  };

  // Handle reordering shifts
  const handleReorderShifts = (newShifts) => {
    updateAppData({ shiftPriorities: newShifts });
  };

  // Handle deleting shifts
  const handleDeleteShifts = (shiftsToDelete) => {
    const newPriorities = selectedShifts.filter(
      (shift) => !shiftsToDelete.includes(shift),
    );
    updateAppData({ shiftPriorities: newPriorities });
  };

  // Reset to default priority
  const handleReset = () => {
    updateAppData({ shiftPriorities: [...totalShifts] });
  };

  // Render shift content
  const renderShiftContent = (shift) => {
    return <div className={styles.shiftContent}>{SHIFT_LABELS[shift]}</div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.shiftSection}>
        <div className={styles.header}>
          <div className={styles.title}>
            <h2 className={styles.listTitle}>My Shift Priorities</h2>
          </div>
        </div>
        <div className={styles.subtitle}>Drag to reorder or tap to manage</div>

        <div className={styles.shiftListSection}>
        <PrioritizedList
          items={selectedShifts}
          onReorder={handleReorderShifts}
          onDelete={handleDeleteShifts}
          renderItemContent={renderShiftContent}
          confirmDelete={true}
          confirmTitle="Confirm Shift Deletion"
          confirmMessage="Are you sure you want to delete the selected shifts?"
          emptyMessage="No shifts selected yet"
          allowMultiDelete={true}
          showEditButton={true}
          className={styles.shiftPriorityList}
          onReset={handleReset}
          resetLabel="Reset"
        />
        </div>
      </div>
      <div className={styles.shiftSection}>
        <div className={styles.header}>
          <div className={styles.title}>
            <h2 className={styles.listTitle}>Available Shifts</h2>
          </div>
        </div>
        <div className={styles.subtitle}>Tap to add to your priorities</div>
        <div className={styles.listContainer}>
          <ul className={styles.shiftList}>
            {availableShifts.length > 0 ? (
              availableShifts.map((shift) => (
                <li
                  key={shift}
                  className={`${styles.shiftItem} ${
                    recentlyAdded.includes(shift) ? styles.recentAdd : ""
                  }`}
                  onClick={() => handleAddShift(shift)}
                >
                  <div className={styles.shiftContent}>
                    <div className={styles.shiftIcon}>+</div>
                    {SHIFT_LABELS[shift]}
                  </div>
                </li>
              ))
            ) : (
              <li className={styles.emptyState}>
                <div className={styles.shiftIcon}>✓</div>
                All shifts added to priorities
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShiftPreference;
