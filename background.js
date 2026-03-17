// Service Worker — Mail to MantisBT
// Handles messaging between content script and popup

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MantisBT] Extension installed');
});

// TODO: badge update logic when case detection is added
