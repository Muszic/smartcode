// Listen for tab updates to track problem visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    trackProblemVisit(tab.url);
  }
});

function trackProblemVisit(url) {
  const problemData = extractProblemData(url);
  
  if (problemData) {
    chrome.storage.local.get(['problems'], (result) => {
      const problems = result.problems || {};
      const platform = problemData.platform;
      
      // Store the problem with timestamp
      if (!problems[platform]) {
        problems[platform] = [];
      }
      
      // Remove if already exists to avoid duplicates
      problems[platform] = problems[platform].filter(
        p => p.url !== problemData.url
      );
      
      // Add to the beginning (most recent)
      problems[platform].unshift({
        ...problemData,
        timestamp: Date.now(),
        status: 'unsolved' // Default status
      });
      
      // Keep only last 10 problems per platform
      problems[platform] = problems[platform].slice(0, 10);
      
      chrome.storage.local.set({ problems });
    });
  }
}

function extractProblemData(url) {
  // LeetCode
  if (url.includes('leetcode.com/problems/')) {
    const match = url.match(/leetcode\.com\/problems\/([^/?]+)/);
    if (match) {
      return {
        platform: 'leetcode',
        name: match[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        url: `https://leetcode.com/problems/${match[1]}/`,
        slug: match[1]
      };
    }
  }
  
  // Codeforces
  if (url.includes('codeforces.com')) {
    // Contest problem: /contest/123/problem/A
    let match = url.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Z]\d?)/);
    if (match) {
      return {
        platform: 'codeforces',
        name: `Contest ${match[1]} - Problem ${match[2]}`,
        url: `https://codeforces.com/contest/${match[1]}/problem/${match[2]}`,
        contestId: match[1],
        problemId: match[2]
      };
    }
    
    // Problemset: /problemset/problem/123/A
    match = url.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z]\d?)/);
    if (match) {
      return {
        platform: 'codeforces',
        name: `Problem ${match[1]}${match[2]}`,
        url: `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`,
        contestId: match[1],
        problemId: match[2]
      };
    }
  }
  
  // CodeChef
  if (url.includes('codechef.com/problems/')) {
    const match = url.match(/codechef\.com\/problems\/([^/?]+)/);
    if (match) {
      return {
        platform: 'codechef',
        name: match[1].toUpperCase(),
        url: `https://www.codechef.com/problems/${match[1]}`,
        slug: match[1]
      };
    }
  }
  
  return null;
}

// Listen for messages from content script about problem status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    chrome.storage.local.get(['problems'], (result) => {
      const problems = result.problems || {};
      const platform = request.platform;
      
      if (problems[platform]) {
        // Normalize URLs for comparison (remove trailing slashes, query params)
        const normalizeUrl = (url) => {
          return url.split('?')[0].replace(/\/$/, '');
        };
        
        const requestUrlNormalized = normalizeUrl(request.url);
        const problem = problems[platform].find(p => 
          normalizeUrl(p.url) === requestUrlNormalized
        );
        
        if (problem) {
          problem.status = request.status;
          chrome.storage.local.set({ problems }, () => {
            console.log(`Updated ${platform} problem status to ${request.status}`);
          });
        }
      }
    });
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});