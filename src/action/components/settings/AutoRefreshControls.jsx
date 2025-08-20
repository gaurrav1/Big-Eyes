import React, { useState, useEffect } from 'react';
import { ToggleButton } from '../button/ToggleButton';
import styles from './AutoRefreshControls.module.css';

export function AutoRefreshControls() {
  const [autoRefreshStatus, setAutoRefreshStatus] = useState({
    isRunning: false,
    lastCleanupTime: 0,
    cleanupCount: 0,
    errorCount: 0,
    metrics: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch auto-refresh status
  const fetchStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: "AUTO_REFRESH_STATUS" });
      setAutoRefreshStatus(response);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to fetch auto-refresh status:', error);
    }
  };

  // Auto-refresh status every 10 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoRefresh = async () => {
    setIsLoading(true);
    try {
      const action = autoRefreshStatus.isRunning ? "AUTO_REFRESH_STOP" : "AUTO_REFRESH_START";
      const response = await chrome.runtime.sendMessage({ type: action });
      
      if (response.success) {
        await fetchStatus();
      } else {
        console.error('Failed to toggle auto-refresh:', response.error);
      }
    } catch (error) {
      console.error('Error toggling auto-refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartAutoRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: "AUTO_REFRESH_RESTART" });
      
      if (response.success) {
        await fetchStatus();
      } else {
        console.error('Failed to restart auto-refresh:', response.error);
      }
    } catch (error) {
      console.error('Error restarting auto-refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCleanup = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: "AUTO_REFRESH_FORCE_CLEANUP" });
      
      if (response.success) {
        console.log('Force cleanup completed:', response);
        await fetchStatus();
      } else {
        console.error('Failed to force cleanup:', response.error);
      }
    } catch (error) {
      console.error('Error during force cleanup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all exhausted data? This will reset all job and schedule tracking.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: "CLEAR_EXHAUSTED_DATA" });
      
      if (response.success) {
        console.log('All exhausted data cleared:', response);
        await fetchStatus();
      } else {
        console.error('Failed to clear exhausted data:', response.error);
      }
    } catch (error) {
      console.error('Error clearing exhausted data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.title}>Auto-Refresh System</h3>
        
        <ToggleButton
          isActive={autoRefreshStatus.isRunning}
          onClick={handleToggleAutoRefresh}
          title="Auto-Refresh Exhaustion Lists"
          disabled={isLoading}
        />

        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Status:</span>
            <span className={`${styles.value} ${autoRefreshStatus.isRunning ? styles.running : styles.stopped}`}>
              {autoRefreshStatus.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.label}>Last Cleanup:</span>
            <span className={styles.value}>{formatTime(autoRefreshStatus.lastCleanupTime)}</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.label}>Total Cleanups:</span>
            <span className={styles.value}>{autoRefreshStatus.cleanupCount}</span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.label}>Errors:</span>
            <span className={`${styles.value} ${autoRefreshStatus.errorCount > 0 ? styles.error : ''}`}>
              {autoRefreshStatus.errorCount}
            </span>
          </div>

          {autoRefreshStatus.metrics?.pairsProcessed !== undefined && (
            <div className={styles.statusItem}>
              <span className={styles.label}>Pairs Processed:</span>
              <span className={styles.value}>{autoRefreshStatus.metrics.pairsProcessed}</span>
            </div>
          )}

          {autoRefreshStatus.metrics?.rotationResets !== undefined && (
            <div className={styles.statusItem}>
              <span className={styles.label}>Rotation Resets:</span>
              <span className={styles.value}>{autoRefreshStatus.metrics.rotationResets}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={handleRestartAutoRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Restart Auto-Refresh'}
          </button>

          <button 
            className={styles.actionButton}
            onClick={handleForceCleanup}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Force Cleanup'}
          </button>

          <button 
            className={`${styles.actionButton} ${styles.dangerButton}`}
            onClick={handleClearAllData}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Clear All Data'}
          </button>
        </div>

        <div className={styles.info}>
          <p className={styles.infoText}>
            Auto-refresh automatically cleans expired job-schedule pairs every 30 seconds, 
            eliminating the need to manually restart the extension.
          </p>
          <p className={styles.infoText}>
            Last updated: {formatTime(lastUpdate)}
          </p>
        </div>
      </div>
    </div>
  );
}