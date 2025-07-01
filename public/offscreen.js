chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "PLAY_SOUND_OFFSCREEN") {
        const audio = document.getElementById("sound");
        audio.volume = 1.0;
        audio
            .play()
            .then(() => console.log("[Offscreen] Audio played!"))
            .catch((e) => console.warn("Audio failed:", e.message));
    }
});