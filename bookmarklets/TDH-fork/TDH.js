(() => {
  // Защита от двойного запуска
  if (document.getElementById('px-seo-panel')) {
    document.getElementById('px-seo-panel').remove();
  }

  const VERSION = "Pavel Medd, ver 1.5";

  // Безопасный эскейп HTML
  const safeText = (t) => t ? t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;") : "";

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

    const titleEl = getQ(sourceDoc, "title");
    const descEl = getQ(sourceDoc, "meta[name=description]i") || getQ(liveDoc, "meta[name=description]i");
    const keywEl = getQ(sourceDoc, "meta[name=keywords]i") || getQ(liveDoc, "meta[name=keywords]i");
    const metas = getQa(sourceDoc, "meta");
    const canonical = getQ(sourceDoc, "link[rel=canonical]")?.href || "";

    let alertStr = "";

    // 1. Умная подсветка длины Title и Description
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

    // 2. Логика H1
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
    
    metas.forEach(m => {
      const name = m.name.toLowerCase();
      if (['robots', 'yandex', 'googlebot'].includes(name)) {
        const bad = m.content.includes('noindex') || m.content.includes('nofollow');
        alertStr += `<p><b>meta ${name}:</b> ${bad ? `<b class="px-red">${safeText(m.content)}</b>` : safeText(m.content)}</p>`;
      }
    });

    if (canonical) alertStr += `<p><b>Canonical:</b> ${canonical === location.href ? `<a href="${canonical}">${canonical}</a>` : `<a href="${canonical}"><b class="px-red">${canonical}</b></a>`}</p>`;

    // 3. Подсветка всех заголовков H1-H6 с ошибками
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

    // 4. Продвинутые ссылки (DOM vs Source)
    const rootDomain = location.hostname.split(".").slice(-2).join(".");
    const ignoreRe = /^(\[no text\]|Facebook|Twitter|Instagram|LinkedIn|Gmail|e-?mail|Pinterest)$/i;

    const parseLinks = (doc) => {
      const ext = [], int = [];
      getQa(doc, "a[href]").forEach(a => {
        try {
          if (!a.hostname) return;
          const url = a.href, text = a.innerText?.trim() || "[no text]";
          const nof = a.rel.includes("nofollow") ? " <b style='text-decoration:underline'>nofollow</b>" : "";
          if (a.hostname.endsWith(rootDomain)) {
            int.push(`<li><a href="${url}" target="_blank">${safeText(decodeURIComponent(url))}</a>${nof}</li>`);
          } else {
            const attrs = Array.from(a.attributes).filter(at => at.name !== "href").map(at => `${at.name}="${safeText(at.value)}"`).join(", ");
            let type = 0;
            if (url.includes("takeprofit.com")) type = 2;
            else if (ignoreRe.test(text) || text === "[no text]") type = 1;
            ext.push({ u: url, t: text, a: attrs, type });
          }
        } catch (e) {}
      });
      return { ext, int: [...new Set(int)].join("") };
    };

    const renderExtTable = (links) => {
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

    const liveData = parseLinks(liveDoc);
    const srcData = sourceText ? parseLinks(sourceDoc) : { ext: [], int: "" };
    
    const extHtml = `
      <h3 class="px-h3">1. DOM Links (${liveData.ext.length})</h3>${renderExtTable(liveData.ext)}
      <h3 class="px-h3" style="margin-top:20px;">2. Source Links (${srcData.ext.length})</h3>${renderExtTable(srcData.ext)}
    `;

    // 5. Изображения и текст
    let altTitleHtml = "", altCnt = 0;
    getQa(liveDoc, "img[alt]").forEach(i => { if (i.alt) { altCnt++; altTitleHtml += `<li><b>alt</b> — ${safeText(i.alt)}</li>`; }});
    getQa(liveDoc, "body [title]").forEach(t => { if (t.title) { altCnt++; altTitleHtml += `<li><b>title</b> — ${safeText(t.title)}</li>`; }});

    const bcnt = getQa(liveDoc, "b").length, strong = getQa(liveDoc, "strong").length, em = getQa(liveDoc, "em").length;
    alertStr += `<p><b>Tags count:</b> b (${bcnt}), strong (${strong}), em (${em})</p>`;

    let cloneBody = codeBody.cloneNode(true);
    getQa(cloneBody, "script, style, noscript").forEach(t => t.remove());
    const bodyText = cloneBody.innerText.replace(/[\r\n\t]/gi, " ").replace(/\s+/g, " ");
    alertStr += `<p><b>Text length:</b> <span title="Without spaces">${bodyText.replace(/\s/g, '').length}</span> | <span title="With spaces">${bodyText.length}</span></p>`;

    // Вкладки
    const tabLinks = `
      <p class="px-tab-nav">
        <b class="px-tab-btn" data-target="px-ext">External Links <span class="px-new">New!</span> (${liveData.ext.length})</b> |
        <b class="px-tab-btn" data-target="px-int">Internal Links</b> |
        <b class="px-tab-btn" data-target="px-img">Img alt/title (${altCnt})</b> |
        <b class="px-tab-btn" data-target="px-hdg">H1-H6 ${hErr ? `<span class="px-red">(${hdgs.length})</span>` : `(${hdgs.length})`}</b> |
        <b class="px-tab-btn" data-target="px-txt">Clean Text</b>
      </p>`;

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
      .px-tab-pane { display:none; padding:15px 20px; }
      .px-tab-pane.active { display:block; }
      .px-tab-pane ol { margin:0; padding-left:25px; color:#b2b5be; font-size:14px; line-height:1.6; }
      .px-tab-pane li { margin-bottom:4px; }
      .px-h3 { color:#d1d4dc; font-size:16px; margin:0 0 10px 0; }
      .px-table { width:100%; border-collapse:collapse; font-size:13px; text-align:left; color:#b2b5be; }
      .px-table th, .px-table td { border:1px solid #2a2e39; padding:8px; }
      .px-table th { background:#131722; position:sticky; top:0; color:#fff; font-weight:600; }
      .px-table tr:not([style]):nth-child(even) { background:#1a1e29; }
    `;

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
        ${tabLinks}
      </div>
      <div class="px-tabs-content">
        <div class="px-tab-pane" id="px-ext" style="padding:0;">${extHtml}</div>
        <div class="px-tab-pane" id="px-int"><ol>${liveData.int}</ol></div>
        <div class="px-tab-pane" id="px-img"><ol>${altTitleHtml}</ol></div>
        <div class="px-tab-pane" id="px-hdg"><ol style="list-style:none;padding-left:0;">${h16Str}</ol></div>
        <div class="px-tab-pane" id="px-txt" style="color:#b2b5be;font-size:14px;white-space:pre-wrap;">${cloneBody.innerHTML}</div>
      </div>
    `;
    document.body.appendChild(panel);

    // События кнопок
    document.getElementById("px-close").onclick = () => panel.remove();
    
    document.getElementById("px-min").onclick = () => {
      panel.classList.toggle("px-minimized");
    };

    document.getElementById("px-hl-toggle").onclick = () => {
      const hlId = "px-hl-style-node";
      const existing = document.getElementById(hlId);
      if (existing) {
        existing.remove();
      } else {
        const s = document.createElement("style");
        s.id = hlId;
        s.textContent = `
          strong::before{content:"stng - "!important} b::before{content:"b - "!important} em::before{content:"em - "!important}
          strong{background:#690!important;border:solid!important;padding:2px!important;color:#000!important}
          b{background:#77D7FF!important;border:solid!important;padding:2px!important;color:#000!important}
          em{background:#b798f5!important;border:solid!important;padding:2px!important;color:#000!important}
          h1::before{content:"H1 - "!important} h2::before{content:"H2 - "!important} h3::before{content:"H3 - "!important}
          h4::before{content:"H4 - "!important} h5::before{content:"H5 - "!important} h6::before{content:"H6 - "!important}
          h1{background:pink!important;border:solid!important;padding:2px!important;color:#000!important}
          h2{background:orange!important;border:solid!important;padding:2px!important;color:#000!important}
          h3{background:yellow!important;border:solid!important;padding:2px!important;color:#000!important}
          h4{background:aquamarine!important;border:solid!important;padding:2px!important;color:#000!important}
          h5{background:lightskyblue!important;border:solid!important;padding:2px!important;color:#000!important}
          h6{background:plum!important;border:solid!important;padding:2px!important;color:#000!important}
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

    const panes = getQa(panel, ".px-tab-pane");
    const tabBtns = getQa(panel, ".px-tab-btn");
    tabBtns.forEach(btn => {
      btn.onclick = (e) => {
        const targetId = e.target.getAttribute("data-target");
        const targetPane = document.getElementById(targetId);
        if (targetPane.classList.contains("active")) {
          targetPane.classList.remove("active");
          e.target.classList.remove("active");
        } else {
          panes.forEach(p => p.classList.remove("active"));
          tabBtns.forEach(b => b.classList.remove("active"));
          targetPane.classList.add("active");
          e.target.classList.add("active");
        }
      };
    });
  };

  // Загрузка Source Code (Откат к безопасному XMLHttpRequest)
  const XHR = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('GET', window.location.href, true);
  xhr.send();
  xhr.onload = () => initPanel(xhr.responseText);
  xhr.onerror = () => initPanel(""); // Если блок, все равно загрузим панель на базе Live DOM

})();
