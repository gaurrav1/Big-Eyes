const CREATE_BTN_TEXT = "Create Application";
const OTHER_JOBS_TEXT = "Apply for other jobs";
const MAX_ATTEMPTS = 20;
const ATTEMPT_INTERVAL = 500; // ms

function findButtonByText(text) {
  return [
    ...document.querySelectorAll(
      'button[data-test-component="StencilReactButton"]',
    ),
  ].find((btn) => {
    // Check both button and its children for the text
    if (btn.textContent?.trim().includes(text)) return true;
    const div = btn.querySelector("div");
    return div && div.textContent?.trim().includes(text);
  });
}

function isButtonClickable(btn) {
  if (!btn) return false;
  const style = window.getComputedStyle(btn);
  return (
    !btn.disabled &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

function tryClickCreateButton(attempt = 1) {
  const createBtn = findButtonByText(CREATE_BTN_TEXT);
  const otherJobsBtn = findButtonByText(OTHER_JOBS_TEXT);

  if (createBtn && isButtonClickable(createBtn)) {
    createBtn.click();
    console.log("Clicked 'Create Application' button on attempt", attempt);

    // Store candidate ID for security validation
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get("candidateId");
    if (candidateId) {
      chrome.storage.local.set({ candidateId });
    }
    return;
  } else if (otherJobsBtn && isButtonClickable(otherJobsBtn)) {
    chrome.storage.local.set({ jobRedirected: false }, () => {
      window.location.href = "https://hiring.amazon.ca/app#/jobSearch";
    });
    return;
  }

  if (attempt < MAX_ATTEMPTS) {
    setTimeout(() => tryClickCreateButton(attempt + 1), ATTEMPT_INTERVAL);
  } else {
    console.warn(
      "Create Application button not found or not clickable after max attempts",
    );
  }
}

function checkConsentPageAndStart() {
  if (window.location.hash.startsWith("#/consent")) {
    tryClickCreateButton();
  }
}

// Initial check
checkConsentPageAndStart();

// Listen for hash changes (SPA navigation)
window.addEventListener("hashchange", checkConsentPageAndStart);

// Also observe DOM changes in case the button appears later
const observer = new MutationObserver(() => {
  if (window.location.hash.startsWith("#/consent")) {
    tryClickCreateButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
