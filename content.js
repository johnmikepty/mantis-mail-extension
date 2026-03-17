// Content Script — DOM extraction for webmail clients
// Injected into Outlook 365 and Gmail pages

(function () {
  function extractOutlook() {
    try {
      return {
        subject: document.querySelector('[data-automation-id="subjectLine"]')?.textContent?.trim() || '',
        body: document.querySelector('[data-automation-id="UniqueMessageBody"]')?.innerText?.trim() || '',
        sender: document.querySelector('.from-container')?.textContent?.trim() || '',
        client: 'outlook'
      };
    } catch {
      return null;
    }
  }

  function extractGmail() {
    try {
      return {
        subject: document.querySelector('h2.hP')?.textContent?.trim() || '',
        body: document.querySelector('.a3s.aiL')?.innerText?.trim() || '',
        sender: document.querySelector('.gD')?.getAttribute('email') || '',
        client: 'gmail'
      };
    } catch {
      return null;
    }
  }

  function extractEmailData() {
    const host = window.location.hostname;
    if (host.includes('outlook')) return extractOutlook();
    if (host.includes('mail.google')) return extractGmail();
    return { subject: '', body: '', sender: '', client: 'unknown' };
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'getEmailData') {
      sendResponse(extractEmailData());
    }
  });
})();
