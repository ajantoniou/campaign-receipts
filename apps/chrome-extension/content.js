console.log("Campaign Receipts Edge extension loaded.");

// Helper to inject the donor influence edge panel
function injectEdgePanel(data) {
  const existingPanel = document.getElementById("cr-edge-panel");
  if (existingPanel) return;

  const panel = document.createElement("div");
  panel.id = "cr-edge-panel";
  panel.style = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 340px;
    background: #0D1117;
    color: #C9D1D9;
    border: 1px solid #30363D;
    border-radius: 8px;
    z-index: 999999;
    font-family: monospace;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;

  let candidatesHtml = '';
  if (data.candidates && Array.isArray(data.candidates)) {
    candidatesHtml = data.candidates.slice(0,3).map(c => 
      `<div style="display: flex; justify-content: space-between; padding: 6px; background: rgba(255,255,255,0.05); margin-bottom: 4px; border-radius: 4px;">
         <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${c.name}</span>
         <strong style="color: #00FF00;">${c.live_odds_pct != null ? c.live_odds_pct + '¢' : '—'}</strong>
       </div>`
    ).join('');
  }

  panel.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid #30363D; display: flex; align-items: center; justify-content: space-between;">
      <strong style="color: #58A6FF; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">CR Edge Active</strong>
      <button id="cr-edge-close" style="background:none; border:none; color: #8B949E; cursor: pointer; font-size: 16px;">×</button>
    </div>
    <div style="padding: 16px;">
      <div style="color: #FF0000; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        ● Whale Alert
      </div>
      <div style="font-size: 20px; color: #FF0000; font-weight: bold; margin-bottom: 4px;">
        $${(data.total_outside_money / 1000000).toFixed(1)}M Injected
      </div>
      <div style="font-size: 12px; color: #8B949E; line-height: 1.5; margin-bottom: 12px;">
        ${data.insight}
      </div>
      <div style="font-size: 10px; text-transform: uppercase; color: #8B949E; margin-bottom: 6px;">
        Implied CR Odds
      </div>
      ${candidatesHtml}
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("cr-edge-close").addEventListener("click", () => {
    panel.remove();
  });
}

// Fetch edge data from the CR API
chrome.storage.local.get(["cr_token"], async (result) => {
  const token = result.cr_token;
  if (!token) {
    console.log("CR Edge: No token found. Please log in via the extension popup.");
    return;
  }

  // Extract polymarket slug from URL
  const match = window.location.pathname.match(/\/event\/([^/]+)/);
  if (!match) return;

  const slug = match[1];
  
  try {
    const API_URL = "http://localhost:3000/api/ext/v1/edge"; // Dev URL
    const res = await fetch(`${API_URL}?slug=${encodeURIComponent(slug)}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.edge_data) {
        injectEdgePanel(data.edge_data);
      }
    } else {
      console.error("CR Edge API Error:", res.status);
    }
  } catch (e) {
    console.error("CR Edge network error:", e);
  }
});
