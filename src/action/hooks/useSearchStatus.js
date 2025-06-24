import { useState, useEffect, useCallback } from 'react';

const useSearchStatus = () => {
    const [isSearching, setIsSearching] = useState(false);

    // Status synchronization
    useEffect(() => {
        const getStatus = () => {
            chrome.runtime.sendMessage(
                { type: "GET_SEARCH_STATUS" },
                response => setIsSearching(response?.isActive || false)
            );
        };

        getStatus();

        const handleMessage = (msg) => {
            if (msg.type === "FETCH_STATUS_UPDATE") {
                setIsSearching(msg.isActive);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    // Toggle handler with error boundaries
    const toggleSearch = useCallback((activate) => {
        chrome.runtime.sendMessage({
            type: "TOGGLE_SEARCH",
            activate
        }, (response) => {
            if (!response?.success) {
                console.error("Search toggle failed:", response?.error);
                setIsSearching(prev => !prev); // Revert UI state
            }
        });
    }, []);

    return {
        isSearching,
        toggleSearch
    };
};

export default useSearchStatus;