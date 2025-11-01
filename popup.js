const platformNames = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef'
};

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function renderProblems() {
  chrome.storage.local.get(['problems'], (result) => {
    const problems = result.problems || {};
    const container = document.getElementById('container');
    
    // Check if there are any problems
    const hasProblems = Object.keys(problems).some(
      platform => problems[platform] && problems[platform].length > 0
    );
    
    if (!hasProblems) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No problems tracked yet!</p>
          <p style="font-size: 12px;">Visit problems on LeetCode, Codeforces, or CodeChef to start tracking.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    // Render each platform
    ['leetcode', 'codeforces', 'codechef'].forEach(platform => {
      const platformProblems = problems[platform];
      
      if (platformProblems && platformProblems.length > 0) {
        const section = document.createElement('div');
        section.className = 'platform-section';
        
        section.innerHTML = `
          <div class="platform-title">
            <div class="platform-icon ${platform}">
              ${platform.charAt(0).toUpperCase()}
            </div>
            ${platformNames[platform]}
          </div>
          <div class="problems-list"></div>
          <button class="clear-btn" data-platform="${platform}">Clear ${platformNames[platform]}</button>
        `;
        
        const problemsList = section.querySelector('.problems-list');
        
        // Show only the most recent unsolved problem (or most recent if all solved)
        const unsolvedProblems = platformProblems.filter(p => p.status === 'unsolved');
        const displayProblem = unsolvedProblems.length > 0 
          ? unsolvedProblems[0] 
          : platformProblems[0];
        
        const item = document.createElement('div');
        item.className = 'problem-item';
        item.innerHTML = `
          <div class="problem-info">
            <div class="problem-name">${displayProblem.name}</div>
            <div class="problem-time">${formatTime(displayProblem.timestamp)}</div>
          </div>
          <div class="problem-status status-${displayProblem.status}">
            ${displayProblem.status === 'solved' ? '✓ Solved' : '⏳ Unsolved'}
          </div>
        `;
        
        item.addEventListener('click', () => {
          chrome.tabs.create({ url: displayProblem.url });
        });
        
        problemsList.appendChild(item);
        
        // Show count if there are more problems
        if (platformProblems.length > 1) {
          const countInfo = document.createElement('div');
          countInfo.style.cssText = 'font-size: 11px; opacity: 0.7; margin-top: 8px; text-align: center;';
          countInfo.textContent = `+${platformProblems.length - 1} more problem${platformProblems.length - 1 > 1 ? 's' : ''} tracked`;
          section.querySelector('.problems-list').appendChild(countInfo);
        }
        
        container.appendChild(section);
      }
    });
    
    // Add clear button listeners
    document.querySelectorAll('.clear-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const platform = btn.dataset.platform;
        
        if (confirm(`Clear all ${platformNames[platform]} problems?`)) {
          delete problems[platform];
          chrome.storage.local.set({ problems }, () => {
            renderProblems();
          });
        }
      });
    });
  });
}

// Render on load
renderProblems();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.problems) {
    renderProblems();
  }
});