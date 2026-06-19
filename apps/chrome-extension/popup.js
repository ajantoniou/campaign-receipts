document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('tokenInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing token
  chrome.storage.local.get(['cr_token'], (result) => {
    if (result.cr_token) {
      tokenInput.value = result.cr_token;
    }
  });

  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) {
      statusDiv.textContent = 'Please enter a token.';
      statusDiv.style.color = '#F85149';
      return;
    }

    chrome.storage.local.set({ cr_token: token }, () => {
      statusDiv.textContent = 'Token saved! Edge activated.';
      statusDiv.style.color = '#3FB950';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    });
  });
});
