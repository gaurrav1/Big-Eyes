chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "PLAY_ALERT_SOUND") {
    const audio = new Audio(chrome.runtime.getURL("sounds/captured.mp3"));
    audio.volume = 1.0;
    audio.play().catch(() => {});
  }
});
