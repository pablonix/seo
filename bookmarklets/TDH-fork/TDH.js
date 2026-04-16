(() => {
  // Prevent duplicate injections
  if (document.getElementById('px-seo-panel')) {
    document.getElementById('px-seo-panel').remove();
  }

  const VERSION = "Pavel Medvedev, ver 2.0";

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

    const liveMetas = getQa(liveDoc, "meta");
    const sourceMetas = getQa(sourceDoc, "meta");
    const findMeta = (metas, name) => metas.find(m => m.name && m.name.toLowerCase() === name);

    // ==========================================
    // 1. OVERVIEW DATA
    // ==========================================
    const titleEl = getQ(sourceDoc, "title");
    const descEl = findMeta(sourceMetas, "description") || findMeta(liveMetas, "description");
    const keywEl = findMeta(sourceMetas, "keywords") || findMeta(liveMetas, "keywords");
    const canonical = getQ(sourceDoc, "link[rel=canonical]")?.href || "";

    let overviewHtml = "";

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

    overviewHtml += buildTagUI("Title", titleEl?.textContent?.trim() || "", 50, 60);
    overviewHtml += buildTagUI("Description", descEl?.content?.trim() || "", 140, 160);

    const h1s = getQa(sourceDoc, "h1").length ? getQa(sourceDoc, "h1") : getQa(liveDoc, "h1");
    if (!h1s.length) {
      overviewHtml += `<p><b class="px-red">H1: missing</b></p>`;
    } else if (h1s.length === 1) {
      const t = h1s[0].textContent.trim();
      overviewHtml += `<p><b>H1</b> (${t.length}): ${safeText(t)}</p>`;
    } else {
      const tArr = h1s.map(h => { const t = h.textContent.trim(); return `${safeText(t)} (${t.length})`; }).join(' <b>|</b> ');
      overviewHtml += `<p><b class="px-red">H1 Multiple (${h1s.length}):</b> <span class="px-red">${tArr}</span></p>`;
    }

    if (keywEl?.content) overviewHtml += `<p><b>Keywords</b> (${keywEl.content.length}): ${safeText(keywEl.content)}</p>`;
    
    sourceMetas.forEach(m => {
      const name = m.name?.toLowerCase() || "";
      if (['robots', 'yandex', 'googlebot'].includes(name)) {
        const bad = m.content.includes('noindex') || m.content.includes('nofollow');
        overviewHtml += `<p><b>meta ${name}:</b> ${bad ? `<b class="px-red">${safeText(m.content)}</b>` : safeText(m.content)}</p>`;
      }
    });

    if (canonical) overviewHtml += `<p><b>Canonical:</b> ${canonical === location.href ? `<a href="${canonical}">${canonical}</a>` : `<a href="${canonical}"><b class="px-red">${canonical}</b></a>`}</p>`;

    const bcnt = getQa(liveDoc, "b").length, strong = getQa(liveDoc, "strong").length, em = getQa(liveDoc, "em").length;
    overviewHtml += `<p><b>Tags count:</b> b (${bcnt}), strong (${strong}), em (${em})</p>`;

    let cloneBody = codeBody.cloneNode(true);
    getQa(cloneBody, "script, style, noscript").forEach(t => t.remove());
    const bodyText = cloneBody.innerText.replace(/[\r\n\t]/gi, " ").replace(/\s+/g, " ");
    overviewHtml += `<p><b>Text length:</b> <span title="Without spaces">${bodyText.replace(/\s/g, '').length}</span> | <span title="With spaces">${bodyText.length}</span></p>`;

    // ==========================================
    // 2. MICRODATA (OpenGraph & Twitter)
    // ==========================================
    const ogTags = ['og:title', 'og:description', 'og:url', 'og:image', 'og:type'];
    const twTags = ['twitter:title', 'twitter:description', 'twitter:card', 'twitter:image', 'twitter:site'];
    const microData = { og: [], tw: [] };
    const microErrors = [];

    const checkMicroTag = (tags, isOg) => {
      tags.forEach(tag => {
        const attrName = isOg ? 'property' : 'name';
        let meta = sourceMetas.find(m => (m.getAttribute(attrName) || '').toLowerCase() === tag);
        if (!meta) meta = liveMetas.find(m => (m.getAttribute(attrName) || '').toLowerCase() === tag);

        if (meta) {
          const content = meta.getAttribute('content');
          microData[isOg ? 'og' : 'tw'].push({ name: tag, value: content, html: meta.outerHTML });
          if (!content) microErrors.push(`Empty content: ${tag}`);
        } else {
          microErrors.push(`Missing ${isOg ? 'OpenGraph' : 'Twitter'}: ${tag}`);
        }
      });
    };

    checkMicroTag(ogTags, true);
    checkMicroTag(twTags, false);

    const renderMicroTable = (dataArr) => {
      return `<table class="px-table">
        <tbody>
          ${dataArr.map(r => `
            <tr title="${safeText(r.html)}" style="cursor:help;">
              <td style="width:140px;color:#cbd5e0;font-weight:600;">${r.name}</td>
              <td>${r.value ? `<span style="word-break:break-all">${safeText(r.value)}</span>` : '<span class="px-red">empty</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    };

    const microHtml = `
      ${microErrors.length 
        ? `<div class="px-error-box"><b class="px-red" style="font-size:15px;margin-bottom:5px;display:block;">Errors (${microErrors.length}):</b><ul style="margin:0;padding-left:18px;">${microErrors.map(e => `<li>${e}</li>`).join('')}</ul></div>` 
        : `<div class="px-success-box">All required microdata tags are valid!</div>`
      }
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;">
        <div><h4 class="px-h3">OpenGraph</h4>${renderMicroTable(microData.og)}</div>
        <div><h4 class="px-h3">Twitter Cards</h4>${renderMicroTable(microData.tw)}</div>
      </div>
    `;

    // ==========================================
    // 3. HEADINGS H1-H6
    // ==========================================
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

    // ==========================================
    // 4. LINKS
    // ==========================================
    const rootDomain = location.hostname.split(".").slice(-2).join(".");
    
    // Hardcoded blacklist function (Socials, Google, Apple, etc.)
    const isBlacklisted = (url, text) => {
      const hostRe = /facebook\.com|twitter\.com|t\.co|instagram\.com|linkedin\.com|pinterest\.com|google\.|youtube\.com|youtu\.be|apple\.com/i;
      const textRe = /^(\[no text\]|Facebook|Twitter|Instagram|LinkedIn|Gmail|e-?mail|Pinterest)$/i;
      return hostRe.test(url) || textRe.test(text) || text === "[no text]";
    };

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
            type = 2; // Priority (Green/Yellow in highlight)
          } else if (isBlacklisted(url, text)) {
            type = 1; // Blacklisted/Dimmed
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
        <div style="margin: 0 0 15px 0; padding: 10px; background: #1a1e29; border: 1px solid #2a2e39; border-radius: 4px;">
          <p style="margin:0 0 5px 0!important; color:#b2b5be; font-size:12px;">Highlight domains (comma separated):</p>
          <div style="display:flex; gap:10px;">
            <input type="text" id="px-whitelist-input" class="px-input-hl" value="${safeText(whitelistStr)}" placeholder="site.com, example.com">
            <button id="px-whitelist-save" class="px-btn-hl" style="border:none;">Save & Clean</button>
          </div>
        </div>
      `;

      return `
        ${configHtml}
        <h3 class="px-h3">1. DOM Links (${liveExt.length})</h3>${renderTable(liveExt)}
        <h3 class="px-h3" style="margin-top:20px;">2. Source Links (${srcExt.length})</h3>${renderTable(srcExt)}
      `;
    };

    // ==========================================
    // 5. IMAGES ALT/TITLE
    // ==========================================
    let altTitleHtml = "", altCnt = 0;
    getQa(liveDoc, "img[alt]").forEach(i => { if (i.alt) { altCnt++; altTitleHtml += `<li><b>alt</b> — ${safeText(i.alt)}</li>`; }});
    getQa(liveDoc, "body [title]").forEach(t => { if (t.title) { altCnt++; altTitleHtml += `<li><b>title</b> — ${safeText(t.title)}</li>`; }});


    // ==========================================
    // UI BUILDER & CSS
    // ==========================================
    const css = `
      #px-seo-panel { position:fixed; width:100%; top:0; left:0; z-index:999999999; font-family:Segoe UI, Arial, sans-serif; transition:max-height 0.3s ease; max-height:100vh; display:flex; flex-direction:column; box-shadow:0 4px 12px rgba(0,0,0,0.5); }
      #px-seo-panel.px-minimized { max-height: 42px !important; overflow: hidden; }
      #px-seo-panel.px-minimized .px-tab-nav-wrapper, #px-seo-panel.px-minimized .px-tabs-content { display: none !important; }
      
      .px-header-bar { background:#131722; border-bottom:1px solid #2a2e39; padding:10px 15px; display:flex; justify-content:space-between; align-items:center; color:#b2b5be; }
      .px-header-left { display:flex; align-items:center; gap:15px; }
      .px-version { font-weight:bold; color:#d1d4dc; font-size:14px; }
      
      .px-btn-hl { background:#2962ff; color:#fff; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer; user-select:none; transition: background 0.2s; }
      .px-btn-hl:hover { background:#1e4eb8; }
      .px-btn-active { background: #089981 !important; }
      .px-input-hl { flex:1; background:#131722; border:1px solid #2a2e39; color:#d1d4dc; padding:4px 8px; border-radius:3px; outline:none; transition: border-color 0.2s; }
      .px-input-hl:focus { border-color: #2962ff; }
      
      .px-controls { display:flex; gap:15px; font-size:20px; font-weight:bold; user-select:none; }
      .px-controls b { cursor:pointer; transition:color 0.2s; line-height:1; }
      .px-controls b:hover { color:#f23645; }
      
      .px-tab-nav-wrapper { background:#131722; padding:0 15px; border-bottom:1px solid #2a2e39; display:flex; flex-wrap:wrap; gap:15px; }
      .px-tab-btn { cursor:pointer; color:#b2b5be; transition:color 0.2s; padding:12px 0; border-bottom:2px solid transparent; font-size:14px; }
      .px-tab-btn:hover, .px-tab-btn.active { color:#ffffff; border-bottom-color:#2962ff; }
      
      .px-tabs-content { background:#1e222d; max-height:50vh; overflow-y:auto; border-radius:0 0 6px 6px; display:block; }
      .px-tab-pane { display:none; padding:15px 20px; }
      .px-tab-pane.active { display:block; }
      
      .px-tab-pane p { margin:0 0 8px 0!important; font-size:14px; line-height:1.5; color:#d1d4dc; }
      .px-tab-pane ol { margin:0; padding-left:25px; color:#b2b5be; font-size:14px; line-height:1.6; }
      .px-tab-pane li { margin-bottom:4px; }
      
      .px-red { color:#f23645!important; }
      .px-warn { font-size:12.5px; font-style:italic; color:#b2b5be; margin-left:8px; }
      .px-copy { text-decoration:underline; cursor:pointer; color:#d1d4dc; }
      .px-copy:hover { color:#2962ff; text-decoration:none; }
      .px-tab-pane a { color:#2962ff; text-decoration:none; }
      .px-tab-pane a:hover { text-decoration:underline; }
      
      .px-h3 { color:#d1d4dc; font-size:16px; margin:0 0 10px 0; }
      .px-table { width:100%; border-collapse:collapse; font-size:13px; text-align:left; color:#b2b5be; }
      .px-table th, .px-table td { border:1px solid #2a2e39; padding:8px; }
      .px-table th { background:#131722; position:sticky; top:0; color:#fff; font-weight:600; }
      .px-table tr:not([style]):nth-child(even) { background:#1a1e29; }
      
      .px-error-box { background: rgba(242,54,69,0.1); border-left: 3px solid #f23645; padding: 12px; margin-bottom: 15px; color:#f7fafc; }
      .px-success-box { background: rgba(8,153,129,0.1); border-left: 3px solid #089981; padding: 12px; margin-bottom: 15px; color: #089981; font-weight: bold; }

      /* Highlight Link Classes */
      .px-ext-grey { background-color: #718096 !important; color: #fff !important; font-weight: bold !important; padding: 0 4px !important; border-radius: 3px !important; display: inline-block; }
      .px-ext-green { background-color: #089981 !important; color: #fff !important; font-weight: bold !important; padding: 0 4px !important; border-radius: 3px !important; display: inline-block; }
      .px-ext-yellow { background-color: #eab308 !important; color: #000 !important; font-weight: bold !important; padding: 0 4px !important; border-radius: 3px !important; display: inline-block; }
    `;

    const getTabNavHtml = (extCount) => `
      <b class="px-tab-btn active" data-target="px-overview">Overview</b>
      <b class="px-tab-btn" data-target="px-micro">Microdata <span id="px-micro-cnt" style="color:${microErrors.length ? '#f23645' : '#089981'}">(${microErrors.length})</span></b>
      <b class="px-tab-btn" data-target="px-ext">Ext Links (<span id="px-ext-cnt">${extCount}</span>)</b>
      <b class="px-tab-btn" data-target="px-int">Int Links</b>
      <b class="px-tab-btn" data-target="px-img">Img alt/title (${altCnt})</b>
      <b class="px-tab-btn" data-target="px-hdg">H1-H6 ${hErr ? `<span class="px-red">(${hdgs.length})</span>` : `(${hdgs.length})`}</b>
      <b class="px-tab-btn" data-target="px-txt">Clean Text</b>
    `;

    const panel = document.createElement("div");
    panel.id = "px-seo-panel";
    panel.innerHTML = `
      <style>${css}</style>
      <div class="px-header-bar">
        <div class="px-header-left">
          <span class="px-version">${VERSION}</span>
          <div class="px-btn-hl" id="px-hl-toggle">Highlight Tags</div>
          <div class="px-btn-hl" id="px-hl-ext-toggle">Highlight Ext Links</div>
        </div>
        <div class="px-controls">
          <b id="px-min" title="Minimize">_</b>
          <b id="px-close" title="Close">×</b>
        </div>
      </div>
      <div class="px-tab-nav-wrapper" id="px-nav-container"></div>
      <div class="px-tabs-content">
        <div class="px-tab-pane active" id="px-overview">${overviewHtml}</div>
        <div class="px-tab-pane" id="px-micro">${microHtml}</div>
        <div class="px-tab-pane" id="px-ext">${renderExtContent()}</div>
        <div class="px-tab-pane" id="px-int"><ol>${intLinksHtml}</ol></div>
        <div class="px-tab-pane" id="px-img"><ol>${altTitleHtml}</ol></div>
        <div class="px-tab-pane" id="px-hdg"><ol style="list-style:none;padding-left:0;">${h16Str}</ol></div>
        <div class="px-tab-pane" id="px-txt" style="color:#b2b5be;font-size:14px;white-space:pre-wrap;">${cloneBody.innerHTML}</div>
      </div>
    `;
    document.body.appendChild(panel);

    const extDomCount = document.querySelectorAll('#px-ext .px-table:first-of-type tbody tr').length;
    document.getElementById('px-nav-container').innerHTML = getTabNavHtml(extDomCount);

    // --- EVENT LISTENERS ---

    // Domain Whitelist Save
    const bindExtListeners = () => {
      const saveBtn = document.getElementById("px-whitelist-save");
      if (saveBtn) {
        saveBtn.onclick = () => {
          const inputVal = document.getElementById("px-whitelist-input").value;
          whitelistStr = cleanDomainsList(inputVal).join(', ');
          
          try { localStorage.setItem('px_seo_whitelist', whitelistStr); } catch(e) {}
          
          document.getElementById("px-ext").innerHTML = renderExtContent();
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

    // Window Controls
    document.getElementById("px-close").onclick = () => panel.remove();
    document.getElementById("px-min").onclick = () => panel.classList.toggle("px-minimized");

    // Highlight External Links Toggle
    let extHlActive = false;
    document.getElementById("px-hl-ext-toggle").onclick = function() {
      extHlActive = !extHlActive;
      
      if (extHlActive) {
        this.classList.add('px-btn-active');
        this.textContent = "Ext Links: ON";
      } else {
        this.classList.remove('px-btn-active');
        this.textContent = "Highlight Ext Links";
      }

      const currentDomains = cleanDomainsList(whitelistStr);
      const links = getQa(liveDoc, "a[href]");

      links.forEach(a => {
        if (!a.hostname || a.hostname.endsWith(rootDomain)) return; // skip internal

        const url = a.href;
        const text = a.innerText?.trim() || "[no text]";
        
        // Skip blacklisted ones
        if (isBlacklisted(url, text)) return;

        if (extHlActive) {
          const linkHost = a.hostname.toLowerCase();
          const isPriority = currentDomains.length > 0 && currentDomains.some(d => linkHost === d || linkHost.endsWith('.' + d));
          const isNofollow = a.rel.toLowerCase().includes("nofollow");

          // Apply Classes
          if (isPriority && !isNofollow) a.classList.add("px-ext-green");
          else if (isPriority && isNofollow) a.classList.add("px-ext-yellow");
          else a.classList.add("px-ext-grey");

          // Apply tooltips (Attributes on new lines)
          const attrStr = Array.from(a.attributes).map(at => `${at.name}="${at.value}"`).join("\n");
          a.setAttribute("data-px-orig-title", a.getAttribute("title") || "");
          a.setAttribute("title", attrStr);

        } else {
          // Remove Classes
          a.classList.remove("px-ext-grey", "px-ext-green", "px-ext-yellow");
          
          // Restore Tooltips
          if (a.hasAttribute("data-px-orig-title")) {
            const orig = a.getAttribute("data-px-orig-title");
            if (orig) a.setAttribute("title", orig);
            else a.removeAttribute("title");
            a.removeAttribute("data-px-orig-title");
          }
        }
      });
    };

    // Highlight Tags Toggle
    document.getElementById("px-hl-toggle").onclick = () => {
      const hlId = "px-hl-style-node";
      const existing = document.getElementById(hlId);
      if (existing) {
        existing.remove();
      } else {
        const s = document.createElement("style");
        s.id = hlId;
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

    // Copy Tool
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

    // Tab Navigation
    panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('px-tab-btn')) {
        const targetId = e.target.getAttribute("data-target");
        const targetPane = document.getElementById(targetId);
        
        if (targetPane.classList.contains("active")) return;
        
        getQa(panel, ".px-tab-pane").forEach(p => p.classList.remove("active"));
        getQa(panel, ".px-tab-btn").forEach(b => b.classList.remove("active"));
        targetPane.classList.add("active");
        e.target.classList.add("active");
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
