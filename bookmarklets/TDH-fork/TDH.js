(() => {
  // Prevent duplicate injections
  if (document.getElementById('px-seo-panel')) {
    document.getElementById('px-seo-panel').remove();
  }

  const VERSION = "Pavel Medd, ver 1.8";

  // Safe HTML escape
  const safeText = (t) => t ? t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;") : "";

  // Strictly clean domain input (removes https, www, paths)
  const cleanDomainsList = (str) => {
    return str.split(',')
      .map(s => s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0].split('#')[0].trim().toLowerCase())
      .filter(s => s.length > 0);
  };

  const initPanel = (sourceText) => {
    const parser = new DOMParser();
    const sourceDoc = sourceText ? parser.parseFromString(sourceText, "text/html") : document;
    const liveDoc = document;
    const codeBody = liveDoc.body;

    if (!codeBody) {
      alert("Validation failed: HTML body missing.");
      return;
    }

    const getQ = (doc, selector) => doc.querySelector(selector);
    const getQa = (doc, selector) => Array.from(doc.querySelectorAll(selector));

    // BULLETPROOF META SELECTION
    const liveMetas = getQa(liveDoc, "meta");
    const sourceMetas = getQa(sourceDoc, "meta");
    const findMeta = (metas, name) => metas.find(m => m.name && m.name.toLowerCase() === name);

    const titleEl = getQ(sourceDoc, "title");
    const descEl = findMeta(sourceMetas, "description") || findMeta(liveMetas, "description");
    const keywEl = findMeta(sourceMetas, "keywords") || findMeta(liveMetas, "keywords");
    const canonical = getQ(sourceDoc, "link[rel=canonical]")?.href || "";

    let alertStr = "";

    // 1. Smart highlighting for Title and Description length
    const buildTagUI = (name, text, min, max) => {
      let html = "", warn = "";
      if (!text) return `<p><b class="px-red">${name}: missing</b></p>`;
      
      const len = text.length;
      warn = (len < min || len > max) ? ` <span class="px-warn">(Recommended length: ${min}–${max} characters)</span>` : "";
      
      if (len < min) {
        html = `<span class="px-red">${safeText(text)}</span>`;
      } else if (len > max) {
        html = `${safeText(text.substring(0, max))}<span class="px-red">${safeText(text.substring(max))}</span>`;
      } else {
        html = safeText(text);
      }
      return `<p><b class="px-copy" title="Copy ${name}" data-copy="${safeText(text)}">${name}</b> (${len}): ${html}${warn}</p>`;
    };

    alertStr += buildTagUI("Title", titleEl?.textContent?.trim() || "", 50, 60);
    alertStr += buildTagUI("Description", descEl?.content?.trim() || "", 140, 160);

    // 2. H1 Logic
    const h1s = getQa(sourceDoc, "h1").length ? getQa(sourceDoc, "h1") : getQa(liveDoc, "h1");
    if (!h1s.length) {
      alertStr += `<p><b class="px-red">H1: missing</b></p>`;
    } else if (h1s.length === 1) {
      const t = h1s[0].textContent.trim();
      alertStr += `<p><b>H1</b> (${t.length}): ${safeText(t)}</p>`;
    } else {
      const tArr = h1s.map(h => { const t = h.textContent.trim(); return `${safeText(t)} (${t.length})`; }).join(' <b>|</b> ');
      alertStr += `<p><b class="px-red">H1 Multiple (${h1s.length}):</b> <span class="px-red">${tArr}</span></p>`;
    }

    if (keywEl?.content) alertStr += `<p><b>Keywords</b> (${keywEl.content.length}): ${safeText(keywEl.content)}</p>`;
    
    sourceMetas.forEach(m => {
      const name = m.name?.toLowerCase() || "";
      if (['robots', 'yandex', 'googlebot'].includes(name)) {
        const bad = m.content.includes('noindex') || m.content.includes('nofollow');
        alertStr += `<p><b>meta ${name}:</b> ${bad ? `<b class="px-red">${safeText(m.content)}</b>` : safeText(m.content)}</p>`;
      }
    });

    if (canonical) alertStr += `<p><b>Canonical:</b> ${canonical === location.href ? `<a href="${canonical}">${canonical}</a>` : `<a href="${canonical}"><b class="px-red">${canonical}</b></a>`}</p>`;

    // 3. Highlight all H1-H6 headings with errors
    const hdgs = getQa(liveDoc, "h1, h2, h3, h4, h5, h6").map(el => ({
      head: Number(el.localName[1]), text: el.textContent.trim(), error: ""
    }));
    const tempHd = []; let hErr = false;
    hdgs.forEach((h, i) => {
      if (i === 0 && h.head !== 1) { h.error = "First heading is not H1. "; hErr = true; }
      if (h.head === 1 && tempHd[1]) h.error += "Multiple H1s. ";
      if (h.head === 1 && tempHd.slice(2).some(Boolean)) h.error += "Not first in hierarchy. ";
      if (h.head !== 1 && !tempHd[h.head - 1]) h.error += "Missing higher-level heading. ";
      if (i > 0 && (h.head - hdgs[i - 1].head > 1)) h.error += "Hierarchy break. ";
      if (!h.text) h.error += "Empty heading.";
      tempHd[h.head] = true;
      if (h.error) hErr = true;
    });
    const h16Str = hdgs.map(h => `<li style="margin-left:${(h.head - 1)*20}px" class="${h.error ? 'px-red' : ''}" title="${h.error}"><span>H${h.head} - ${safeText(h.text) || "[Empty]"}</span></li>`).join("");

    // 4. Links Analysis Setup
    const rootDomain = location.hostname.split(".").slice(-2).join(".");
    const ignoreRe = /^(\[no text\]|Facebook|Twitter|Instagram|LinkedIn|Gmail|e-?mail|Pinterest)$/i;

    // LocalStorage Whitelist (Default: site.com)
    let whitelistStr = "site.com";
    try {
      const stored = localStorage.getItem('px_seo_whitelist');
      if (stored !== null) whitelistStr = stored;
    } catch(e) {}

    const intLinksHtml = (() => {
      const int = [];
      getQa(liveDoc, "a[href]").forEach(a => {
        try {
          if (a.hostname && a.hostname.endsWith(rootDomain)) {
            const nof = a.rel.includes("nofollow") ? " <b style='text-decoration:underline'>nofollow</b>" : "";
            int.push(`<li><a href="${a.href}" target="_blank">${safeText(decodeURIComponent(a.href))}</a>${nof}</li>`);
          }
        } catch(e) {}
      });
      return [...new Set(int)].join("");
    })();

    // Advanced dynamic parsing strict domain check
    const parseExtLinks = (doc, domainsArr) => {
      const ext = [];
      getQa(doc, "a[href]").forEach(a => {
        try {
          if (!a.hostname || a.hostname.endsWith(rootDomain)) return;
          const url = a.href, text = a.innerText?.trim() || "[no text]";
          const attrs = Array.from(a.attributes).filter(at => at.name !== "href").map(at => `${at.name}="${safeText(at.value)}"`).join(", ");
          
          let type = 0;
          const linkHost = a.hostname.toLowerCase();
          
          if (domainsArr.length > 0 && domainsArr.some(d => linkHost === d || linkHost.endsWith('.' + d))) {
            type = 2; // Green highlight
          } else if (ignoreRe.test(text) || text === "[no text]") {
            type = 1; // Dimmed
          }
          ext.push({ u: url, t: text, a: attrs, type });
        } catch(e) {}
      });
      return ext;
    };

    const renderExtContent = () => {
      const currentDomains = cleanDomainsList(whitelistStr);
      const liveExt = parseExtLinks(liveDoc, currentDomains);
      const srcExt = sourceText ? parseExtLinks(sourceDoc, currentDomains) : [];

      const renderTable = (links) => {
        if (!links.length) return `<p style="padding:10px;color:#b2b5be;">No links found.</p>`;
        const sorted = [...links.filter(l => l.type === 2), ...links.filter(l => l.type === 0), ...links.filter(l => l.type === 1)];
        const rows = sorted.map(l => {
          let st = "";
          if (l.type === 2) st = "background:rgba(8,153,129,0.15);color:#089981;font-weight:bold;";
          else if (l.type === 1) st = "opacity:0.5;";
          return `<tr style="${st}"><td style="word-break:break-all;"><a href="${l.u}" target="_blank">${l.u}</a></td><td>${safeText(l.t)}</td><td style="font-size:0.85em;color:#888;">${l.a}</td></tr>`;
        }).join("");
        return `<table class="px-table"><thead><tr><th>URL</th><th>Anchor</th><th>Attrs</th></tr></thead><tbody>${rows}</tbody></table>`;
      };

      const configHtml = `
        <div style="margin: 15px; padding: 10px; background: #1a1e29; border: 1px solid #2a2e39; border-radius: 4px;">
          <p style="margin:0 0 5px 0!important; color:#b2b5be; font-size:12px;">Highlight domains (comma separated):</p>
          <div style="display:flex; gap:10px;">
            <input type="text" id="px-whitelist-input" class="px-input-hl" value="${safeText(whitelistStr)}" placeholder="site.com, example.com">
            <button id="px-whitelist-save" class="px-btn-hl" style="border:none;">Save & Clean</button>
          </div>
        </div>
      `;

      return `
        ${configHtml}
        <div style="padding: 0 15px 15px 15px;">
          <h3 class="px-h3">1. DOM Links (${liveExt.length})</h3>${renderTable(liveExt)}
          <h3 class="px-h3" style="margin-top:20px;">2. Source Links (${srcExt.length})</h3>${renderTable(srcExt)}
        </div>
      `;
    };

    // 5. Images and text
    let altTitleHtml = "", altCnt = 0;
    getQa(liveDoc, "img[alt]").forEach(i => { if (i.alt) { altCnt++; altTitleHtml += `<li><b>alt</b> — ${safeText(i.alt)}</li>`; }});
    getQa(liveDoc, "body [title]").forEach(t => { if (t.title) { altCnt++; altTitleHtml += `<li><b>title</b> — ${safeText(t.title)}</li>`; }});

    const bcnt = getQa(liveDoc, "b").length, strong = getQa(liveDoc, "strong").length, em = getQa(liveDoc, "em").length;
    alertStr += `<p><b>Tags count:</b> b (${bcnt}), strong (${strong}), em (${em})</p>`;

    let cloneBody = codeBody.cloneNode(true);
    getQa(cloneBody, "script, style, noscript").forEach(t => t.remove());
    const bodyText = cloneBody.innerText.replace(/[\r\n\t]/gi, " ").replace(/\s+/g, " ");
    alertStr += `<p><b>Text length:</b> <span title="Without spaces">${bodyText.replace(/\s/g, '').length}</span> | <span title="With spaces">${bodyText.length}</span></p>`;

    // CSS
    const css = `
      #px-seo-panel { position:fixed; width:100%; top:0; left:0; z-index:999999999; font-family:Segoe UI, Arial, sans-serif; transition:max-height 0.3s ease; max-height:100vh; display:flex; flex-direction:column; box-shadow:0 4px 12px rgba(0,0,0,0.5); }
      #px-seo-panel.px-minimized { max-height: 42px !important; overflow: hidden; }
      #px-seo-panel.px-minimized .px-body, #px-seo-panel.px-minimized .px-tabs-content { display: none !important; }
      .px-header-bar { background:#131722; border-bottom:1px solid #2a2e39; padding:10px 15px; display:flex; justify-content:space-between; align-items:center; color:#b2b5be; }
      .px-header-left { display:flex; align-items:center; gap:15px; }
      .px-version { font-weight:bold; color:#d1d4dc; font-size:14px; }
      .px-new { color:#f23645; font-size:11px; vertical-align:super; font-weight:bold; }
      .px-btn-hl { background:#2962ff; color:#fff; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer; user-select:none; }
      .px-btn-hl:hover { background:#1e4eb8; }
      .px-input-hl { flex:1; background:#131722; border:1px solid #2a2e39; color:#d1d4dc; padding:4px 8px; border-radius:3px; outline:none; transition: border-color 0.2s; }
      .px-input-hl:focus { border-color: #2962ff; }
      .px-controls { display:flex; gap:15px; font-size:20px; font-weight:bold; user-select:none; }
      .px-controls b { cursor:pointer; transition:color 0.2s; line-height:1; }
      .px-controls b:hover { color:#f23645; }
      .px-body { background:#131722; padding:15px; max-height:40vh; overflow-y:auto; border-bottom:1px solid #2a2e39; display:block; }
      .px-body p { margin:0 0 6px 0!important; font-size:14px; line-height:1.4; color:#d1d4dc; }
      .px-red { color:#f23645!important; }
      .px-warn { font-size:12.5px; font-style:italic; color:#b2b5be; margin-left:8px; }
      .px-copy { text-decoration:underline; cursor:pointer; color:#d1d4dc; }
      .px-copy:hover { color:#2962ff; text-decoration:none; }
      .px-body a { color:#2962ff; text-decoration:none; }
      .px-body a:hover { text-decoration:underline; }
      .px-tab-nav { margin-top:15px!important; padding-top:10px; border-top:1px dashed #2a2e39; }
      .px-tab-btn { cursor:pointer; color:#b2b5be; transition:color 0.2s; }
      .px-tab-btn:hover, .px-tab-btn.active { color:#ffffff; border-bottom:1px solid #2962ff; }
      .px-tabs-content { background:#1e222d; max-height:45vh; overflow-y:auto; border-radius:0 0 6px 6px; display:block; }
      .px-tab-pane { display:none; }
      .px-tab-pane.active { display:block; }
      .px-tab-pane ol { margin:0; padding-left:25px; color:#b2b5be; font-size:14px; line-height:1.6; }
      .px-tab-pane li { margin-bottom:4px; }
      .px-h3 { color:#d1d4dc; font-size:16px; margin:0 0 10px 0; }
      .px-table { width:100%; border-collapse:collapse; font-size:13px; text-align:left; color:#b2b5be; }
      .px-table th, .px-table td { border:1px solid #2a2e39; padding:8px; }
      .px-table th { background:#131722; position:sticky; top:0; color:#fff; font-weight:600; }
      .px-table tr:not([style]):nth-child(even) { background:#1a1e29; }
    `;

    const getTabNavHtml = (extCount) => `
      <p class="px-tab-nav">
        <b class="px-tab-btn" data-target="px-ext">Ext Links <span class="px-new">New!</span> (<span id="px-ext-cnt">${extCount}</span>)</b> |
        <b class="px-tab-btn" data-target="px-int">Int Links</b> |
        <b class="px-tab-btn" data-target="px-img">Img alt/title (${altCnt})</b> |
        <b class="px-tab-btn" data-target="px-hdg">H1-H6 ${hErr ? `<span class="px-red">(${hdgs.length})</span>` : `(${hdgs.length})`}</b> |
        <b class="px-tab-btn" data-target="px-txt">Clean Text</b>
      </p>`;

    const panel = document.createElement("div");
    panel.id = "px-seo-panel";
    panel.innerHTML = `
      <style>${css}</style>
      <div class="px-header-bar">
        <div class="px-header-left">
          <span class="px-version">${VERSION}</span>
          <div class="px-btn-hl" id="px-hl-toggle">Highlight Tags</div>
        </div>
        <div class="px-controls">
          <b id="px-min" title="Minimize">_</b>
          <b id="px-close" title="Close">×</b>
        </div>
      </div>
      <div class="px-body">
        ${alertStr}
        <div id="px-nav-container"></div>
      </div>
      <div class="px-tabs-content">
        <div class="px-tab-pane" id="px-ext">${renderExtContent()}</div>
        <div class="px-tab-pane" id="px-int" style="padding:15px 20px;"><ol>${intLinksHtml}</ol></div>
        <div class="px-tab-pane" id="px-img" style="padding:15px 20px;"><ol>${altTitleHtml}</ol></div>
        <div class="px-tab-pane" id="px-hdg" style="padding:15px 20px;"><ol style="list-style:none;padding-left:0;">${h16Str}</ol></div>
        <div class="px-tab-pane" id="px-txt" style="padding:15px 20px;color:#b2b5be;font-size:14px;white-space:pre-wrap;">${cloneBody.innerHTML}</div>
      </div>
    `;
    document.body.appendChild(panel);

    const extDomCount = document.querySelectorAll('#px-ext .px-table:first-of-type tbody tr').length;
    document.getElementById('px-nav-container').innerHTML = getTabNavHtml(extDomCount);

    // --- EVENT LISTENERS ---
    const bindExtListeners = () => {
      const saveBtn = document.getElementById("px-whitelist-save");
      if (saveBtn) {
        saveBtn.onclick = () => {
          const inputVal = document.getElementById("px-whitelist-input").value;
          
          // Clean the URLs upon saving
          whitelistStr = cleanDomainsList(inputVal).join(', ');
          
          try { localStorage.setItem('px_seo_whitelist', whitelistStr); } catch(e) { alert("Local storage is blocked."); }
          
          document.getElementById("px-ext").innerHTML = renderExtContent();
          
          // Update the UI value to show the cleaned version
          document.getElementById("px-whitelist-input").value = whitelistStr;
          
          const newExtCount = document.querySelectorAll('#px-ext .px-table:first-of-type tbody tr').length;
          document.getElementById("px-ext-cnt").innerText = newExtCount;

          bindExtListeners();
          
          const newSaveBtn = document.getElementById("px-whitelist-save");
          const orig = newSaveBtn.textContent;
          newSaveBtn.textContent = "Saved!";
          newSaveBtn.style.background = "#089981";
          setTimeout(() => { newSaveBtn.textContent = orig; newSaveBtn.style.background = ""; }, 1000);
        };
      }
    };
    bindExtListeners();

    document.getElementById("px-close").onclick = () => panel.remove();
    document.getElementById("px-min").onclick = () => panel.classList.toggle("px-minimized");

    document.getElementById("px-hl-toggle").onclick = () => {
      const hlId = "px-hl-style-node";
      const existing = document.getElementById(hlId);
      if (existing) {
        existing.remove();
      } else {
        const s = document.createElement("style");
        s.id = hlId;
        // Strict exclusion of the #px-seo-panel and all its children
        s.textContent = `
          strong:not(#px-seo-panel strong)::before{content:"stng - "!important} 
          b:not(#px-seo-panel b)::before{content:"b - "!important} 
          em:not(#px-seo-panel em)::before{content:"em - "!important}
          
          strong:not(#px-seo-panel strong){background:#690!important;border:solid!important;padding:2px!important;color:#000!important}
          b:not(#px-seo-panel b){background:#77D7FF!important;border:solid!important;padding:2px!important;color:#000!important}
          em:not(#px-seo-panel em){background:#b798f5!important;border:solid!important;padding:2px!important;color:#000!important}
          
          h1:not(#px-seo-panel h1)::before{content:"H1 - "!important} 
          h2:not(#px-seo-panel h2)::before{content:"H2 - "!important} 
          h3:not(#px-seo-panel h3)::before{content:"H3 - "!important}
          h4:not(#px-seo-panel h4)::before{content:"H4 - "!important} 
          h5:not(#px-seo-panel h5)::before{content:"H5 - "!important} 
          h6:not(#px-seo-panel h6)::before{content:"H6 - "!important}
          
          h1:not(#px-seo-panel h1){background:pink!important;border:solid!important;padding:2px!important;color:#000!important}
          h2:not(#px-seo-panel h2){background:orange!important;border:solid!important;padding:2px!important;color:#000!important}
          h3:not(#px-seo-panel h3){background:yellow!important;border:solid!important;padding:2px!important;color:#000!important}
          h4:not(#px-seo-panel h4){background:aquamarine!important;border:solid!important;padding:2px!important;color:#000!important}
          h5:not(#px-seo-panel h5){background:lightskyblue!important;border:solid!important;padding:2px!important;color:#000!important}
          h6:not(#px-seo-panel h6){background:plum!important;border:solid!important;padding:2px!important;color:#000!important}
        `;
        document.head.appendChild(s);
      }
    };

    getQa(panel, ".px-copy").forEach(btn => {
      btn.onclick = (e) => {
        const text = e.target.getAttribute("data-copy");
        const ta = document.createElement('textarea');
        document.body.appendChild(ta);
        ta.value = text;
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        
        const orig = e.target.textContent;
        e.target.textContent = "Copied!";
        e.target.style.color = "#089981";
        setTimeout(() => { e.target.textContent = orig; e.target.style.color = ""; }, 1000);
      };
    });

    panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('px-tab-btn')) {
        const targetId = e.target.getAttribute("data-target");
        const targetPane = document.getElementById(targetId);
        
        if (targetPane.classList.contains("active")) {
          targetPane.classList.remove("active");
          e.target.classList.remove("active");
        } else {
          getQa(panel, ".px-tab-pane").forEach(p => p.classList.remove("active"));
          getQa(panel, ".px-tab-btn").forEach(b => b.classList.remove("active"));
          targetPane.classList.add("active");
          e.target.classList.add("active");
        }
      }
    });
  };

  const XHR = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('GET', window.location.href, true);
  xhr.send();
  xhr.onload = () => initPanel(xhr.responseText);
  xhr.onerror = () => initPanel(""); 

})();
