

# Lite version
```javascript
javascript:(function(){const panelId='meta-inspector-panel';let panel=document.getElementById(panelId);if(panel){panel.remove();return;}const e=document,t=['og:title','og:description','og:url','og:image','og:type'],n=['twitter:title','twitter:description','twitter:card','twitter:image','twitter:site'],o=Array.from(e.querySelectorAll('meta')),d={og:[],tw:[]},l=[];t.forEach(r=>{const a=o.find(i=>(i.getAttribute('property')||'').toLowerCase()===r);a?(d.og.push({name:r,value:a.getAttribute('content'),html:a.outerHTML}),a.getAttribute('content')||l.push(`Empty content: ${r}`)):l.push(`Missing OpenGraph: ${r}`)}),n.forEach(r=>{const a=o.find(i=>(i.getAttribute('name')||'').toLowerCase()===r);a?(d.tw.push({name:r,value:a.getAttribute('content'),html:a.outerHTML}),a.getAttribute('content')||l.push(`Empty content: ${r}`)):l.push(`Missing Twitter: ${r}`)});panel=e.createElement('div');panel.id=panelId;panel.style='position:fixed;top:0;left:0;right:0;background:#2d3748;z-index:9999;padding:15px;box-shadow:0 4px 6px rgba(0,0,0,0.1);font-family:system-ui,-apple-system,sans-serif;color:#f7fafc;max-height:80vh;overflow:auto;border-bottom:1px solid #4a5568;';panel.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px">🔍 Meta Inspector <span style="font-size:14px;color:${l.length?'#f56565':'#68d391'}">${l.length?`${l.length} errors`:'All valid'}</span></h3><div><button onclick="document.getElementById('${panelId}').remove()" style="background:#e53e3e;color:white;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-weight:500">Close</button></div></div>
${l.length?`<div style="background:#e53e3e20;padding:10px;border-radius:4px;margin-bottom:15px;border-left:3px solid #e53e3e"><ul style="margin:0;padding-left:18px">${l.map(r=>`<li style="margin:4px 0">${r}</li>`).join('')}</ul></div>`:''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:10px">
<div style="background:#4a5568;padding:12px;border-radius:6px"><h4 style="margin:0 0 12px 0;font-size:15px;color:#a0aec0">OpenGraph</h4><table style="width:100%;border-collapse:collapse;font-size:14px">${d.og.map(r=>`<tr title="${r.html.replace(/"/g,'&quot;')}" style="border-bottom:1px solid #718096;cursor:help"><td style="padding:8px 0;color:#cbd5e0">${r.name}</td><td style="padding:8px 0">${r.value?`<span style="word-break:break-all">${r.value}</span>`:'<span style="color:#f56565">empty</span>'}</td></tr>`).join('')}</table></div>
<div style="background:#4a5568;padding:12px;border-radius:6px"><h4 style="margin:0 0 12px 0;font-size:15px;color:#a0aec0">Twitter</h4><table style="width:100%;border-collapse:collapse;font-size:14px">${d.tw.map(r=>`<tr title="${r.html.replace(/"/g,'&quot;')}" style="border-bottom:1px solid #718096;cursor:help"><td style="padding:8px 0;color:#cbd5e0">${r.name}</td><td style="padding:8px 0">${r.value?`<span style="word-break:break-all">${r.value}</span>`:'<span style="color:#f56565">empty</span>'}</td></tr>`).join('')}</table></div>
</div>
<div style="font-size:12px;color:#a0aec0;text-align:center;padding-top:10px;border-top:1px solid #4a5568">© Pavel Medvedev | github.com/pablonix/seo</div>`;document.body.prepend(panel)})();
```

# Advanced PRO version

Minified
```
javascript:!function(){const e={debug:!0,limits:{url:256,title:100,description:300},colors:{error:"#ff5555",warning:"#ff9d00",success:"#55ff55",info:"#55aaff",optional:"#55ccaa",text:"#ffffff",bg:"#1a1a1a",panel:"#252525"},requirements:{og:{required:["og:title","og:type","og:image","og:url"],important:["og:description"],recommended:["og:site_name","og:locale","og:image:width","og:image:height"],propertyOnly:!0},twitter:{required:["twitter:card","twitter:title","twitter:image"],important:["twitter:description","twitter:site"],recommended:["twitter:creator","twitter:image:width","twitter:image:height"],nameOnly:!0}}};function t(...t){e.debug&&console.log("[OG Debug]",...t)}function n(e){return e&&e.length?e.some((e=>"error"===e.type))?"error":"warning":"success"}function r(t){return e.colors[t]||e.colors.text}!function(){const i="meta-inspector-pro",s=document,o=s.getElementById(i);if(o)return o.remove();const a=Array.from(s.querySelectorAll("meta"));t("Total meta tags found:",a.length);const p={og:[],twitter:[],errors:[],warnings:[],info:[]};function l(t){const n=e.requirements[t];[...n.required,...n.important,...n.recommended].forEach((r=>{const i=a.find((e=>e.getAttribute("property")===r||e.getAttribute("name")===r)),s=n.required.includes(r),o=n.important.includes(r),l=n.recommended.includes(r);if(i){const n=function(t,n){const r=[],i=n.getAttribute("content")||"",s=n.getAttribute("property"),o=n.getAttribute("name");if(e.requirements.og.propertyOnly&&t.startsWith("og:")&&!s&&r.push({type:"warning",message:"Should use property attribute"}),e.requirements.twitter.nameOnly&&t.startsWith("twitter:")&&!o&&r.push({type:"warning",message:"Should use name attribute"}),"og:url"!==t&&"og:image"!==t&&"twitter:image"!==t||(i.startsWith("http")||r.push({type:"warning",message:"Relative URL"}),i.length>e.limits.url&&r.push({type:"warning",message:`Long URL (>${e.limits.url} chars)`}),/\.(svg|bmp)$/i.test(i)&&r.push({type:"error",message:"Unsupported format"})),t.endsWith("title")&&i.length>e.limits.title&&r.push({type:"warning",message:`Long title (>${e.limits.title} chars)`}),t.endsWith("description")&&(i?i.length>e.limits.description&&r.push({type:"warning",message:`Long description (>${e.limits.description} chars)`}):r.push({type:"warning",message:"Empty description"})),t.includes(":width")||t.includes(":height")){const e=t.includes("twitter")?120:200;parseInt(i)<e&&r.push({type:"warning",message:`Min ${e}px`})}return"og:type"!==t||["website","article","book","profile","music","video"].includes(i)||r.push({type:"warning",message:"Non-standard type"}),"twitter:card"!==t||["summary","summary_large_image","app","player"].includes(i)||r.push({type:"warning",message:"Non-standard card"}),r.length?r:null}(r,i),a=i.getAttribute("content")||"";n&&n.forEach((e=>{"error"===e.type&&p.errors.push(`${r}: ${e.message}`),"warning"===e.type&&p.warnings.push(`${r}: ${e.message}`)})),p[t].push({name:r,value:a,html:i.outerHTML,issues:n,isRequired:s,isImportant:o,isRecommended:l})}else if(s||o){const e=s?"error":"warning",n=`Missing: ${r}`;p[t].push({name:r,value:"",html:"",issues:[{type:e,message:"Not found"}],isRequired:s,isImportant:o,isRecommended:!1}),"error"===e?p.errors.push(n):p.warnings.push(n)}else l&&p.info.push(`Optional missing: ${r}`)}))}function g(e){let t="success";return e.forEach((e=>{const r=n(e.issues);"error"===r?t="error":"warning"===r&&"error"!==t&&(t="warning")})),t}l("og"),l("twitter");const d=g(p.og),c=g(p.twitter),u=p.errors.length?"error":p.warnings.length?"warning":"success",m=s.createElement("div");function f(t){const i=n(t.issues),s=r(i),o=t.isRequired?e.colors.error:e.colors.warning,a=t.value?r(i):o,p=t.isRecommended;return`\n <div title="${t.html.replace(/"/g,"&quot;")}" \n style="padding: 8px 0; border-bottom: 1px solid #333; cursor: help;">\n <div style="display: flex; justify-content: space-between; align-items: flex-start;">\n <div style="font-weight: ${t.isRequired?"bold":"normal"}; \n color: ${p?e.colors.optional:s}; \n font-size: 14px;">\n ${t.name}\n ${t.issues?`\n<span style="margin-left: 6px; font-size: 12px;">\n ${t.issues.map((e=>`\n <span style="color: ${r(e.type)};">\n (${e.message})\n </span>\n `)).join(" ")}\n</span>\n `:""}\n </div>\n ${t.issues?`\n<div style="color: ${s}; font-size: 12px;">\n ${t.issues.some((e=>"error"===e.type))?"⚠":""}\n ${t.issues.some((e=>"warning"===e.type))?"⚠":""}\n</div>\n `:""}\n </div>\n <div style="word-break: break-all; \n color: ${a}; \n margin-top: 4px;\n font-size: ${t.value.length>50?"13px":"14px"};">\n ${t.value||'<span style="color: '+o+'">(missing)</span>'}\n </div>\n </div>\n `}function h(t,i,s=!1){if(!t.length)return"";const o=t.some((e=>"error"===n(e.issues)))?"error":t.some((e=>"warning"===n(e.issues)))?"warning":"success";return`\n <div style="margin-bottom: ${s?"0":"16px"};">\n <div style="color: ${s?e.colors.optional:r(o)}; \n font-size: 16px; \n font-weight: bold;\n margin: 16px 0 8px 0;\n padding-top: ${s?"8px":"0"};\n border-top: ${s?"2px solid #444":"none"};\n border-bottom: 1px solid #444;">\n ${i}\n </div>\n ${t.map(f).join("")}\n </div>\n `}m.id=i,m.style=`\n position: fixed;\n top: 0;\n left: 0;\n right: 0;\n background: ${e.colors.bg};\n z-index: 9999;\n padding: 15px;\n color: ${e.colors.text};\n font-family: system-ui, sans-serif;\n max-height: 80vh;\n overflow: auto;\n line-height: 1.5;\n box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n `;let y=`\n <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">\n <div style="display: flex; align-items: center; gap: 10px;">\n <span style="font-size: 24px;">🔍</span>\n <h3 style="margin: 0; font-size: 18px;">\n Meta Inspector \n <span style="color: ${r(u)};">\n ${"error"===u?"Critical":"warning"===u?"Warning":"Looks Good"}\n </span>\n </h3>\n </div>\n <button onclick="document.getElementById('${i}').remove()" \n style="background: ${e.colors.error}; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">\n Close\n </button>\n </div>\n `;if(y+=`\n <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">\n \x3c!-- OpenGraph Section --\x3e\n <div style="background: ${e.colors.panel}; padding: 12px; border-radius: 8px;">\n <h4 style="margin: 0 0 12px 0; color: ${r(d)}; font-size: 16px; display: flex; align-items: center;">\n <span style="color: ${r(d)}; margin-right: 8px;">\n ${"success"===d?"✓":"⚠"}\n </span>\n OpenGraph Tags - ${"error"===d?"Critical":"warning"===d?"Warning":"Looks Good"}\n </h4>\n ${h(p.og.filter((e=>e.isRequired)),"Required")}\n ${h(p.og.filter((e=>e.isImportant)),"Important")}\n ${h(p.og.filter((e=>e.isRecommended)),"Recommended",!0)}\n </div>\n \n \x3c!-- Twitter Section --\x3e\n <div style="background: ${e.colors.panel}; padding: 12px; border-radius: 8px;">\n <h4 style="margin: 0 0 12px 0; color: ${r(c)}; font-size: 16px; display: flex; align-items: center;">\n <span style="color: ${r(c)}; margin-right: 8px;">\n ${"success"===c?"✓":"⚠"}\n </span>\n Twitter Cards - ${"error"===c?"Critical":"warning"===c?"Warning":"Looks Good"}\n </h4>\n ${h(p.twitter.filter((e=>e.isRequired)),"Required")}\n ${h(p.twitter.filter((e=>e.isImportant)),"Important")}\n ${h(p.twitter.filter((e=>e.isRecommended)),"Recommended",!0)}\n </div>\n </div>\n `,e.debug){const x=a.filter((e=>e.getAttribute("property")?.startsWith("og:")||e.getAttribute("name")?.startsWith("og:"))),b=a.filter((e=>e.getAttribute("property")?.startsWith("twitter:")||e.getAttribute("name")?.startsWith("twitter:")));function w(e){const t=e.getAttribute("property"),n=e.getAttribute("name"),r=(e.getAttribute("content")||"").substring(0,50);return`&lt;meta ${t?`property="${t}"`:""} ${n?`name="${n}"`:""} content="${r}${r.length>50?"...":""}"&gt;`}y+=`\n <div style="background: #333; padding: 12px; border-radius: 8px;">\n <h4 style="margin: 0 0 10px 0; color: #aaa; font-size: 16px;">Debug Info</h4>\n <div style="font-family: monospace; font-size: 12px; color: #ccc;">\n <strong>OpenGraph Tags:</strong><br>\n ${x.map(w).join("<br>")||"No OpenGraph tags found"}\n <br><br>\n <strong>Twitter Tags:</strong><br>\n ${b.map(w).join("<br>")||"No Twitter tags found"}\n </div>\n </div>\n `}y+='\n <div style="text-align: center; color: #666; margin-top: 16px; font-size: 12px;">\n © Pavel Medvedev | github.com/pablonix/seo\n </div>\n ',m.innerHTML=y,s.body.prepend(m),t("Scan results:",p)}()}()
```

Full code
```
javascript:(function(){
  // Configuration
  const CONFIG = {
    debug: true,
    limits: {
      url: 256,
      title: 100,
      description: 300
    },
    colors: {
      error: '#ff5555',
      warning: '#ff9d00',
      success: '#55ff55',
      info: '#55aaff',
      optional: '#55ccaa',
      text: '#ffffff',
      bg: '#1a1a1a',
      panel: '#252525'
    },
    requirements: {
      og: {
        required: ['og:title', 'og:type', 'og:image', 'og:url'],
        important: ['og:description'],
        recommended: ['og:site_name', 'og:locale', 'og:image:width', 'og:image:height'],
        propertyOnly: true
      },
      twitter: {
        required: ['twitter:card', 'twitter:title', 'twitter:image'],
        important: ['twitter:description', 'twitter:site'],
        recommended: ['twitter:creator', 'twitter:image:width', 'twitter:image:height'],
        nameOnly: true
      }
    }
  };

  // Helpers
  function debugLog(...args) {
    if (CONFIG.debug) console.log('[OG Debug]', ...args);
  }

  function getTagSeverity(issues) {
    if (!issues || !issues.length) return 'success';
    return issues.some(i => i.type === 'error') ? 'error' : 'warning';
  }

  function getTextColor(severity) {
    return CONFIG.colors[severity] || CONFIG.colors.text;
  }

  // Main function
  function init() {
    const panelId = 'meta-inspector-pro';
    const doc = document;
    
    // Remove existing panel
    const existingPanel = doc.getElementById(panelId);
    if (existingPanel) return existingPanel.remove();

    // Collect all meta tags
    const allMetaTags = Array.from(doc.querySelectorAll('meta'));
    debugLog('Total meta tags found:', allMetaTags.length);

    // Results storage
    const results = {
      og: [],
      twitter: [],
      errors: [],
      warnings: [],
      info: []
    };

    // Validate meta tag
    function validateMetaTag(tagName, meta) {
      const issues = [];
      const value = meta.getAttribute('content') || '';
      const property = meta.getAttribute('property');
      const name = meta.getAttribute('name');
      
      // Validate attribute type
      if (CONFIG.requirements.og.propertyOnly && tagName.startsWith('og:') && !property) {
        issues.push({type: 'warning', message: 'Should use property attribute'});
      }
      
      if (CONFIG.requirements.twitter.nameOnly && tagName.startsWith('twitter:') && !name) {
        issues.push({type: 'warning', message: 'Should use name attribute'});
      }

      // URL validation
      if (tagName === 'og:url' || tagName === 'og:image' || tagName === 'twitter:image') {
        if (!value.startsWith('http')) {
          issues.push({type: 'warning', message: 'Relative URL'});
        }
        if (value.length > CONFIG.limits.url) {
          issues.push({type: 'warning', message: `Long URL (>${CONFIG.limits.url} chars)`});
        }
        if (/\.(svg|bmp)$/i.test(value)) {
          issues.push({type: 'error', message: 'Unsupported format'});
        }
      }

      // Title validation
      if (tagName.endsWith('title')) {
        if (value.length > CONFIG.limits.title) {
          issues.push({type: 'warning', message: `Long title (>${CONFIG.limits.title} chars)`});
        }
      }

      // Description validation
      if (tagName.endsWith('description')) {
        if (!value) {
          issues.push({type: 'warning', message: 'Empty description'});
        } else if (value.length > CONFIG.limits.description) {
          issues.push({type: 'warning', message: `Long description (>${CONFIG.limits.description} chars)`});
        }
      }

      // Dimension validation
      if (tagName.includes(':width') || tagName.includes(':height')) {
        const minSize = tagName.includes('twitter') ? 120 : 200;
        if (parseInt(value) < minSize) {
          issues.push({type: 'warning', message: `Min ${minSize}px`});
        }
      }

      // Type validation
      if (tagName === 'og:type' && !['website','article','book','profile','music','video'].includes(value)) {
        issues.push({type: 'warning', message: 'Non-standard type'});
      }

      if (tagName === 'twitter:card' && !['summary','summary_large_image','app','player'].includes(value)) {
        issues.push({type: 'warning', message: 'Non-standard card'});
      }

      return issues.length ? issues : null;
    }

    // Process tags
    function processTags(namespace) {
      const config = CONFIG.requirements[namespace];
      
      [...config.required, ...config.important, ...config.recommended].forEach(tagName => {
        const meta = allMetaTags.find(m => 
          (m.getAttribute('property') === tagName) || 
          (m.getAttribute('name') === tagName)
        );
        
        const isRequired = config.required.includes(tagName);
        const isImportant = config.important.includes(tagName);
        const isRecommended = config.recommended.includes(tagName);
        
        if (meta) {
          const issues = validateMetaTag(tagName, meta);
          const value = meta.getAttribute('content') || '';
          
          if (issues) {
            issues.forEach(issue => {
              if (issue.type === 'error') results.errors.push(`${tagName}: ${issue.message}`);
              if (issue.type === 'warning') results.warnings.push(`${tagName}: ${issue.message}`);
            });
          }
          
          results[namespace].push({
            name: tagName,
            value: value,
            html: meta.outerHTML,
            issues: issues,
            isRequired,
            isImportant,
            isRecommended
          });
        } else if (isRequired || isImportant) {
          const issueType = isRequired ? 'error' : 'warning';
          const message = `Missing: ${tagName}`;
          
          results[namespace].push({
            name: tagName,
            value: '',
            html: '',
            issues: [{type: issueType, message: 'Not found'}],
            isRequired,
            isImportant,
            isRecommended: false
          });
          
          if (issueType === 'error') results.errors.push(message);
          else results.warnings.push(message);
        } else if (isRecommended) {
          results.info.push(`Optional missing: ${tagName}`);
        }
      });
    }

    // Process all namespaces
    processTags('og');
    processTags('twitter');

    // Calculate namespace severities
    function calculateNamespaceSeverity(tags) {
      let severity = 'success';
      tags.forEach(tag => {
        const tagSeverity = getTagSeverity(tag.issues);
        if (tagSeverity === 'error') severity = 'error';
        else if (tagSeverity === 'warning' && severity !== 'error') severity = 'warning';
      });
      return severity;
    }

    const ogSeverity = calculateNamespaceSeverity(results.og);
    const twitterSeverity = calculateNamespaceSeverity(results.twitter);
    const overallSeverity = results.errors.length ? 'error' : results.warnings.length ? 'warning' : 'success';

    // Create panel
    const panel = doc.createElement('div');
    panel.id = panelId;
    panel.style = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${CONFIG.colors.bg};
      z-index: 9999;
      padding: 15px;
      color: ${CONFIG.colors.text};
      font-family: system-ui, sans-serif;
      max-height: 80vh;
      overflow: auto;
      line-height: 1.5;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    // Render functions
    function renderTag(tag) {
      const severity = getTagSeverity(tag.issues);
      const titleColor = getTextColor(severity);
      const missingColor = tag.isRequired ? CONFIG.colors.error : CONFIG.colors.warning;
      const valueColor = tag.value ? getTextColor(severity) : missingColor;
      const isOptional = tag.isRecommended;
      
      return `
        <div title="${tag.html.replace(/"/g, '&quot;')}" 
             style="padding: 8px 0; border-bottom: 1px solid #333; cursor: help;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="font-weight: ${tag.isRequired ? 'bold' : 'normal'}; 
                        color: ${isOptional ? CONFIG.colors.optional : titleColor}; 
                        font-size: 14px;">
              ${tag.name}
              ${tag.issues ? `
                <span style="margin-left: 6px; font-size: 12px;">
                  ${tag.issues.map(issue => `
                    <span style="color: ${getTextColor(issue.type)};">
                      (${issue.message})
                    </span>
                  `).join(' ')}
                </span>
              ` : ''}
            </div>
            ${tag.issues ? `
              <div style="color: ${titleColor}; font-size: 12px;">
                ${tag.issues.some(i => i.type === 'error') ? '⚠' : ''}
                ${tag.issues.some(i => i.type === 'warning') ? '⚠' : ''}
              </div>
            ` : ''}
          </div>
          <div style="word-break: break-all; 
                     color: ${valueColor}; 
                     margin-top: 4px;
                     font-size: ${tag.value.length > 50 ? '13px' : '14px'};">
            ${tag.value || '<span style="color: ' + missingColor + '">(missing)</span>'}
          </div>
        </div>
      `;
    }

    function renderSection(tags, title, isRecommended = false) {
      if (!tags.length) return '';
      
      const severity = tags.some(t => getTagSeverity(t.issues) === 'error') ? 'error' : 
                       tags.some(t => getTagSeverity(t.issues) === 'warning') ? 'warning' : 'success';
      
      return `
        <div style="margin-bottom: ${isRecommended ? '0' : '16px'};">
          <div style="color: ${isRecommended ? CONFIG.colors.optional : getTextColor(severity)}; 
                      font-size: 16px; 
                      font-weight: bold;
                      margin: 16px 0 8px 0;
                      padding-top: ${isRecommended ? '8px' : '0'};
                      border-top: ${isRecommended ? '2px solid #444' : 'none'};
                      border-bottom: 1px solid #444;">
            ${title}
          </div>
          ${tags.map(renderTag).join('')}
        </div>
      `;
    }

    // Panel content
    let panelHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">🔍</span>
          <h3 style="margin: 0; font-size: 18px;">
            Meta Inspector 
            <span style="color: ${getTextColor(overallSeverity)};">
              ${overallSeverity === 'error' ? 'Critical' : overallSeverity === 'warning' ? 'Warning' : 'Looks Good'}
            </span>
          </h3>
        </div>
        <button onclick="document.getElementById('${panelId}').remove()" 
                style="background: ${CONFIG.colors.error}; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    // Main content
    panelHTML += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <!-- OpenGraph Section -->
        <div style="background: ${CONFIG.colors.panel}; padding: 12px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px 0; color: ${getTextColor(ogSeverity)}; font-size: 16px; display: flex; align-items: center;">
            <span style="color: ${getTextColor(ogSeverity)}; margin-right: 8px;">
              ${ogSeverity === 'success' ? '✓' : '⚠'}
            </span>
            OpenGraph Tags - ${ogSeverity === 'error' ? 'Critical' : ogSeverity === 'warning' ? 'Warning' : 'Looks Good'}
          </h4>
          ${renderSection(results.og.filter(t => t.isRequired), 'Required')}
          ${renderSection(results.og.filter(t => t.isImportant), 'Important')}
          ${renderSection(results.og.filter(t => t.isRecommended), 'Recommended', true)}
        </div>
        
        <!-- Twitter Section -->
        <div style="background: ${CONFIG.colors.panel}; padding: 12px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px 0; color: ${getTextColor(twitterSeverity)}; font-size: 16px; display: flex; align-items: center;">
            <span style="color: ${getTextColor(twitterSeverity)}; margin-right: 8px;">
              ${twitterSeverity === 'success' ? '✓' : '⚠'}
            </span>
            Twitter Cards - ${twitterSeverity === 'error' ? 'Critical' : twitterSeverity === 'warning' ? 'Warning' : 'Looks Good'}
          </h4>
          ${renderSection(results.twitter.filter(t => t.isRequired), 'Required')}
          ${renderSection(results.twitter.filter(t => t.isImportant), 'Important')}
          ${renderSection(results.twitter.filter(t => t.isRecommended), 'Recommended', true)}
        </div>
      </div>
    `;

    // Debug info
    if (CONFIG.debug) {
      const ogTags = allMetaTags.filter(m => 
        m.getAttribute('property')?.startsWith('og:') || 
        m.getAttribute('name')?.startsWith('og:')
      );
      const twitterTags = allMetaTags.filter(m => 
        m.getAttribute('property')?.startsWith('twitter:') || 
        m.getAttribute('name')?.startsWith('twitter:')
      );

      function renderDebugTag(m) {
        const property = m.getAttribute('property');
        const name = m.getAttribute('name');
        const content = (m.getAttribute('content') || '').substring(0, 50);
        return `&lt;meta ${property ? `property="${property}"` : ''} ${name ? `name="${name}"` : ''} content="${content}${content.length > 50 ? '...' : ''}"&gt;`;
      }

      panelHTML += `
        <div style="background: #333; padding: 12px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #aaa; font-size: 16px;">Debug Info</h4>
          <div style="font-family: monospace; font-size: 12px; color: #ccc;">
            <strong>OpenGraph Tags:</strong><br>
            ${ogTags.map(renderDebugTag).join('<br>') || 'No OpenGraph tags found'}
            <br><br>
            <strong>Twitter Tags:</strong><br>
            ${twitterTags.map(renderDebugTag).join('<br>') || 'No Twitter tags found'}
          </div>
        </div>
      `;
    }

    // Footer
    panelHTML += `
      <div style="text-align: center; color: #666; margin-top: 16px; font-size: 12px;">
        © Pavel Medvedev | github.com/pablonix/seo
      </div>
    `;

    panel.innerHTML = panelHTML;
    doc.body.prepend(panel);

    debugLog('Scan results:', results);
  }

  init();
})();
```
