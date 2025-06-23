import { useState, useEffect, useRef } from 'react';
import styles from './ShiftPreference.module.css';
import { useAppContext } from '../../context/AppContext';

const ShiftPreference = () => {
  const { appData, updateAppData } = useAppContext();
  const [editMode, setEditMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);
  const dragNode = useRef(null);
  
  const totalShifts = ["Flex", "Full", "Part", "Reduced"];
  const selectedShifts = appData.shiftPriorities || [];
  
  // Calculate available shifts
  const availableShifts = totalShifts.filter(
    shift => !selectedShifts.includes(shift)
  );

  // Handle adding a shift
  const handleAddShift = (shift) => {
    const newPriorities = [...selectedShifts, shift];
    updateAppData({ shiftPriorities: newPriorities });
    setRecentlyAdded([shift]);
    setTimeout(() => setRecentlyAdded([]), 300);
  };

  // Handle drag start
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    dragNode.current = e.target;
    dragNode.current.classList.add(styles.dragging);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.target, 20, 20);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    
    if (dragItem.current !== null && dragItem.current !== index) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const offset = bounds.y + bounds.height / 2;
      
      if (e.clientY < offset) {
        e.currentTarget.classList.add(styles.dragUp);
      } else {
        e.currentTarget.classList.add(styles.dragDown);
      }
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = () => {
    setDragOverIndex(null);
    document.querySelectorAll(`.${styles.dragUp}, .${styles.dragDown}`).forEach(el => {
      el.classList.remove(styles.dragUp, styles.dragDown);
    });
    if (dragNode.current) {
      dragNode.current.classList.remove(styles.dragging);
    }
    dragNode.current = null;
    dragItem.current = null;
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (selectedShifts.length - selectedToDelete.length === 0) {
      alert("You must have at least one shift selected!");
      setShowConfirm(false);
      return;
    }
    
    const newPriorities = selectedShifts.filter(
      shift => !selectedToDelete.includes(shift)
    );
    updateAppData({ shiftPriorities: newPriorities });
    setSelectedToDelete([]);
    setShowConfirm(false);
  };

  // Handle drag end
  const handleDragEnd = (e, targetIndex) => {
    if (dragItem.current === null || dragItem.current === targetIndex) {
      handleDrop();
      return;
    }
    
    const newPriorities = [...selectedShifts];
    const [movedItem] = newPriorities.splice(dragItem.current, 1);
    newPriorities.splice(targetIndex, 0, movedItem);
    
    updateAppData({ shiftPriorities: newPriorities });
    handleDrop();
  };

  // Reset to default priority
  const handleReset = () => {
    updateAppData({ shiftPriorities: [...totalShifts] });
  };

  // Handle priority change
  const handlePriorityChange = (index, direction) => {
    if (index === 0 && direction === 'up') return;
    if (index === selectedShifts.length - 1 && direction === 'down') return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPriorities = [...selectedShifts];
    [newPriorities[index], newPriorities[newIndex]] = 
      [newPriorities[newIndex], newPriorities[index]];
    
    updateAppData({ shiftPriorities: newPriorities });
  };

  return (
    <div className={styles.container}>
      <div className={styles.listContainer}>
        <div className={styles.header}>
          <h2 className={styles.listTitle}>Available Shifts</h2>
          <div className={styles.subtitle}>Tap to add to your priorities</div>
        </div>
        
        <ul className={styles.shiftList}>
          {availableShifts.length > 0 ? (
            availableShifts.map(shift => (
              <li 
                key={shift}
                className={`${styles.shiftItem} ${
                  recentlyAdded.includes(shift) ? styles.recentAdd : ''
                }`}
                onClick={() => handleAddShift(shift)}
              >
                <div className={styles.shiftContent}>
                  <div className={styles.shiftIcon}>+</div>
                  {shift} time
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

      <div className={styles.listContainer}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.listTitle}>My Shift Priorities</h2>
            <div className={styles.subtitle}>
              {editMode ? 
                "Select shifts to delete or drag to reorder" : 
                "Drag to reorder or tap Edit to manage"}
            </div>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.resetButton}
              onClick={handleReset}
            >
              Reset
            </button>
            <button 
              className={styles.editButton}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
        
        <ul className={styles.shiftList}>
          {selectedShifts.length > 0 ? (
            selectedShifts.map((shift, index) => (
              <li
                key={`${shift}-${index}`}
                className={`${styles.shiftItem} ${styles.selectedItem} ${
                  editMode ? styles.editMode : ''
                } ${dragOverIndex === index ? styles.dragOver : ''}`}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={(e) => handleDragEnd(e, index)}
              >
                {editMode && (
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedToDelete.includes(shift)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedToDelete([...selectedToDelete, shift]);
                      } else {
                        setSelectedToDelete(selectedToDelete.filter(s => s !== shift));
                      }
                    }}
                    disabled={selectedShifts.length === 1}
                  />
                )}
                
                <div className={styles.shiftContent}>
                  <span className={styles.priorityBadge}>{index + 1}</span>
                  {shift} time
                </div>
                
                <div className={styles.controls}>
                  {!editMode && (
                    <div className={styles.priorityControls}>
                      <button 
                        className={`${styles.arrowButton} ${index === 0 ? styles.disabled : ''}`}
                        onClick={() => handlePriorityChange(index, 'up')}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button 
                        className={`${styles.arrowButton} ${index === selectedShifts.length - 1 ? styles.disabled : ''}`}
                        onClick={() => handlePriorityChange(index, 'down')}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  
                  {editMode && (
                    <div className={styles.dragHandle}>
                      <div className={styles.dragDot}></div>
                      <div className={styles.dragDot}></div>
                      <div className={styles.dragDot}></div>
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className={styles.emptyState}>
              <div className={styles.shiftIcon}>!</div>
              No shifts selected yet
            </li>
          )}
        </ul>
        
        {editMode && selectedToDelete.length > 0 && (
          <div className={styles.deleteContainer}>
            <button
              className={styles.deleteButton}
              onClick={() => setShowConfirm(true)}
            >
              Delete Selected ({selectedToDelete.length})
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3 className={styles.confirmTitle}>Confirm Deletion</h3>
            <p className={styles.confirmText}>
              Are you sure you want to delete {selectedToDelete.length} shift{selectedToDelete.length > 1 ? 's' : ''}?
            </p>
            <ul className={styles.deleteList}>
              {selectedToDelete.map(shift => (
                <li key={shift} className={styles.deleteItem}>
                  {shift} time
                </li>
              ))}
            </ul>
            {selectedShifts.length - selectedToDelete.length === 0 && (
              <div className={styles.warning}>
                ⚠️ You must have at least one shift selected
              </div>
            )}
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmButton}
                onClick={confirmDelete}
                disabled={selectedShifts.length - selectedToDelete.length === 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftPreference;