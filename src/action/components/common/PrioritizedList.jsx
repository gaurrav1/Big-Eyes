import { useState, useRef, useCallback } from "react";
import { ConfirmationDialog } from "../dialog/ConfirmationDialog";
import styles from "./PrioritizedList.module.css";

/**
 * A generalized component for prioritized lists with drag-and-drop reordering and deletion confirmation.
 *
 * @param {Object} props
 * @param {Array} props.items - The list of items to display
 * @param {Function} props.onReorder - Callback when items are reordered (receives new items array)
 * @param {Function} props.onDelete - Callback when items are deleted (receives array of deleted items)
 * @param {Function} props.renderItem - Function to render each item (receives item, index, and isDragging)
 * @param {Function} props.renderItemContent - Function to render the content of each item (receives item and index)
 * @param {Function} props.renderItemExtra - Optional function to render additional content for each item (e.g., km display)
 * @param {boolean} props.confirmDelete - Whether to show a confirmation dialog when deleting items
 * @param {string} props.confirmTitle - Title for the confirmation dialog
 * @param {string} props.confirmMessage - Message for the confirmation dialog
 * @param {string} props.emptyMessage - Message to display when the list is empty
 * @param {boolean} props.allowMultiDelete - Whether to allow multiple items to be deleted at once
 * @param {boolean} props.showEditButton - Whether to show the edit button
 * @param {Function} [props.onReset] - Optional callback for a Reset button
 * @param {string} props.resetLabel - Optional label for the Reset button
 * @param {string} props.className - Additional CSS class for the container
 */
export const PrioritizedList = ({
  items = [],
  onReorder,
  onDelete,
  renderItem,
  renderItemContent,
  renderItemExtra,
  confirmDelete = true,
  confirmTitle = "Confirm Deletion",
  confirmMessage = "Are you sure you want to delete the selected items?",
  emptyMessage = "No items in the list",
  allowMultiDelete = false,
  showEditButton = false,
  onReset,
  resetLabel = "Reset",
  className = "",
}) => {
  const [editMode, setEditMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragItem = useRef(null);
  const dragNode = useRef(null);

  // Handle drag start
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    dragNode.current = e.target;
    dragNode.current.classList.add(styles.dragging);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.target, 20, 20);
    setIsDragging(true);
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

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    document
      .querySelectorAll(`.${styles.dragUp}, .${styles.dragDown}`)
      .forEach((el) => {
        el.classList.remove(styles.dragUp, styles.dragDown);
      });
    if (dragNode.current) {
      dragNode.current.classList.remove(styles.dragging);
    }

    if (
      dragItem.current !== null &&
      dropIndex !== null &&
      dragItem.current !== dropIndex
    ) {
      const newItems = [...items];
      const [movedItem] = newItems.splice(dragItem.current, 1);
      newItems.splice(dropIndex, 0, movedItem);
      onReorder(newItems);
    }

    dragNode.current = null;
    dragItem.current = null;
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    document
      .querySelectorAll(`.${styles.dragUp}, .${styles.dragDown}`)
      .forEach((el) => {
        el.classList.remove(styles.dragUp, styles.dragDown);
      });
    if (dragNode.current) {
      dragNode.current.classList.remove(styles.dragging);
    }
    dragNode.current = null;
    dragItem.current = null;
    setIsDragging(false);
  };

  // Handle delete confirmation
  const confirmDeleteItems = () => {
    if (items.length - selectedToDelete.length === 0) {
      alert("You must have at least one item!");
      setShowConfirm(false);
      return;
    }

    onDelete(selectedToDelete);
    setSelectedToDelete([]);
    setShowConfirm(false);
  };

  // Handle delete item
  const handleDeleteItem = useCallback(
    (item) => {
      if (confirmDelete) {
        setSelectedToDelete([item]);
        setShowConfirm(true);
      } else {
        onDelete([item]);
      }
    },
    [confirmDelete, onDelete],
  );

  // Handle select item for deletion
  const handleSelectItem = useCallback((item, isSelected) => {
    if (isSelected) {
      setSelectedToDelete((prev) => [...prev, item]);
    } else {
      setSelectedToDelete((prev) => prev.filter((i) => i !== item));
    }
  }, []);

  // Handle delete selected items
  const handleDeleteSelected = () => {
    if (selectedToDelete.length > 0) {
      setShowConfirm(true);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {(showEditButton || onReset) && (
        <div className={styles.header}>
          {showEditButton && (
            <button
              className={styles.editButton}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Done" : "Edit"}
            </button>
          )}
          {onReset && (
            <button
              className={styles.resetButton}
              onClick={onReset}
              type="button"
            >
              {resetLabel}
            </button>
          )}
        </div>
      )}

      <div className={styles.listContainer}>
        {items.length > 0 ? (
          <ul className={styles.itemList}>
            {items.map((item, index) => (
              <li
                key={`item-${index}`}
                className={`${styles.itemWrapper} ${index === dragOverIndex ? styles.dragOver : ""}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {renderItem ? (
                  renderItem(item, index, isDragging)
                ) : (
                  <div
                    className={`${styles.item} ${editMode ? styles.editMode : ""} ${editMode && selectedToDelete.includes(item) ? styles.selectedItem : ""}`}
                    onClick={() => {
                      if (editMode) {
                        handleSelectItem(
                          item,
                          !selectedToDelete.includes(item),
                        );
                      }
                    }}
                  >
                    <div className={styles.priorityBadge}>{index + 1}</div>

                    {editMode && <div className={styles.dragHandle}>≡</div>}

                    <div className={styles.itemContent}>
                      {renderItemContent
                        ? renderItemContent(item, index)
                        : JSON.stringify(item)}
                    </div>

                    {renderItemExtra && (
                      <div className={styles.itemExtra}>
                        {renderItemExtra(item, index)}
                      </div>
                    )}

                    {editMode && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteItem(item)}
                        aria-label="Delete item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>{emptyMessage}</div>
        )}
      </div>

      {editMode && allowMultiDelete && selectedToDelete.length > 0 && (
        <div className={styles.deleteContainer}>
          <button
            className={styles.deleteSelectedButton}
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedToDelete.length})
          </button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirm}
        title={confirmTitle}
        message={`${confirmMessage} (${selectedToDelete.length} item${selectedToDelete.length > 1 ? "s" : ""})`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteItems}
        onCancel={() => setShowConfirm(false)}
      >
        {selectedToDelete.length > 0 && (
          <ul className={styles.deleteList}>
            {selectedToDelete.map((item, index) => (
              <li key={`delete-${index}`} className={styles.deleteItem}>
                {renderItemContent
                  ? renderItemContent(item, index)
                  : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        )}
      </ConfirmationDialog>
    </div>
  );
};
