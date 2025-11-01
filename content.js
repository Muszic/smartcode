// Detect if problem is solved on different platforms
function checkProblemStatus() {
  const url = window.location.href;
  let status = 'unsolved';
  let platform = '';
  
  // LeetCode - check for success indicators
  if (url.includes('leetcode.com')) {
    platform = 'leetcode';
    
    // Check multiple times as LeetCode loads dynamically
    const checkLeetCode = () => {
      // Method 1: Check for Accepted in result panel
      const resultPanel = document.querySelector('[data-e2e-locator="console-result"]');
      if (resultPanel && resultPanel.textContent.includes('Accepted')) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
        return;
      }
      
      // Method 2: Check submissions table
      const submissions = document.querySelectorAll('[role="row"], .submission-item');
      const hasAccepted = Array.from(submissions).some(row => {
        const text = row.textContent.toLowerCase();
        return text.includes('accepted') && !text.includes('wrong') && !text.includes('error');
      });
      
      if (hasAccepted) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
        return;
      }
      
      // Method 3: Check for success status text
      const allText = document.body.textContent;
      const hasSuccessPattern = /accepted.*?runtime|runtime.*?accepted|success.*?submission/i.test(allText);
      
      if (hasSuccessPattern) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
        return;
      }
      
      // Method 4: Look for green checkmark or success indicators in problem header
      const greenElements = document.querySelectorAll('[class*="text-green"], [class*="text-success"]');
      const hasGreenCheck = Array.from(greenElements).some(el => 
        el.innerHTML.includes('check') || el.innerHTML.includes('✓') || el.textContent.includes('Solved')
      );
      
      if (hasGreenCheck) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
      }
    };
    
    // Check immediately and after delays for dynamic content
    checkLeetCode();
    setTimeout(checkLeetCode, 1000);
    setTimeout(checkLeetCode, 2000);
    setTimeout(checkLeetCode, 3000);
    setTimeout(checkLeetCode, 5000);
  }
  
  // Codeforces - check for accepted verdict
  if (url.includes('codeforces.com')) {
    platform = 'codeforces';
    
    const checkCodeforces = () => {
      const verdicts = document.querySelectorAll('.verdict-accepted, [class*="accepted"]');
      if (verdicts.length > 0) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
      }
    };
    
    checkCodeforces();
    setTimeout(checkCodeforces, 2000);
    setTimeout(checkCodeforces, 4000);
  }
  
  // CodeChef - check for successful submission
  if (url.includes('codechef.com')) {
    platform = 'codechef';
    
    const checkCodeChef = () => {
      const success = document.querySelector('.accepted, [class*="success"], [class*="correct"]');
      if (success) {
        status = 'solved';
        notifyStatusChange(platform, url, status);
      }
    };
    
    checkCodeChef();
    setTimeout(checkCodeChef, 2000);
    setTimeout(checkCodeChef, 4000);
  }
}

function notifyStatusChange(platform, url, status) {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    platform: platform,
    url: url,
    status: status
  });
}

// Run on page load
checkProblemStatus();

// Observer for dynamic content changes (especially for LeetCode)
const observer = new MutationObserver(() => {
  checkProblemStatus();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also listen for URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkProblemStatus();
  }
}).observe(document, { subtree: true, childList: true });