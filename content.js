function notifyStatusChange(platform, url, status) {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    platform: platform,
    url: url,
    status: status
  });
}

function setupObserver() {
  const url = window.location.href;

  // LeetCode
  if (url.includes('leetcode.com/problems/')) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const successNode = Array.from(mutation.addedNodes).find(node => 
            node.textContent && node.textContent.includes('Accepted')
          );
          if (successNode) {
            notifyStatusChange('leetcode', url, 'solved');
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Codeforces
  if (url.includes('codeforces.com')) {
    const observer = new MutationObserver(() => {
      if (document.querySelector('.verdict-accepted')) {
        notifyStatusChange('codeforces', url, 'solved');
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // CodeChef
  if (url.includes('codechef.com/problems/')) {
    const observer = new MutationObserver(() => {
      if (document.querySelector('.result-accepted')) {
        notifyStatusChange('codechef', url, 'solved');
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Initial check and setup observer
setupObserver();

// Handle single-page navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setupObserver();
  }
}).observe(document.body, { childList: true, subtree: true });