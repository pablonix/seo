

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
        critical: ['og:title', 'og:type', 'og:image', 'og:url'],
        important: ['og:description'],
        recommended: ['og:site_name', 'og:locale', 'og:image:width', 'og:image:height'],
        propertyOnly: true
      },
      twitter: {
        critical: ['twitter:card', 'twitter:title', 'twitter:image'],
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
        issues.push({type: 'error', message: 'Must use name attribute'});
      }

      // URL validation (only for actual URL fields)
      if (tagName === 'og:url' || tagName === 'og:image' || tagName === 'twitter:image') {
        if (!value.startsWith('http')) {
          issues.push({type: 'error', message: 'Relative URL'});
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

      // Dimension validation (only for dimension fields)
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
      
      [...config.critical, ...config.important, ...config.recommended].forEach(tagName => {
        const meta = allMetaTags.find(m => 
          (m.getAttribute('property') === tagName) || 
          (m.getAttribute('name') === tagName)
        );
        
        const isCritical = config.critical.includes(tagName);
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
            isCritical,
            isImportant,
            isRecommended
          });
        } else if (isCritical || isImportant) {
          const issueType = isCritical ? 'error' : 'warning';
          const message = `Missing: ${tagName}`;
          
          results[namespace].push({
            name: tagName,
            value: '',
            html: '',
            issues: [{type: issueType, message: 'Not found'}],
            isCritical,
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
      const valueColor = tag.value ? getTextColor(severity) : CONFIG.colors.error;
      const isOptional = tag.isRecommended;
      
      return `
        <div title="${tag.html.replace(/"/g, '&quot;')}" 
             style="padding: 8px 0; border-bottom: 1px solid #333; cursor: help;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="font-weight: ${tag.isCritical ? 'bold' : 'normal'}; 
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
            ${tag.value || '<span style="color: #ff5555">(missing)</span>'}
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
                      font-size: 14px; 
                      margin-bottom: 8px;
                      padding-top: ${isRecommended ? '8px' : '0'};
                      border-top: ${isRecommended ? '1px solid #333' : 'none'};">
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
            <span style="color: ${results.errors.length ? CONFIG.colors.error : CONFIG.colors.success};">
              ${results.errors.length || '✓'}
            </span>
            ${results.warnings.length ? `
              <span style="color: ${CONFIG.colors.warning}; margin-left: 8px;">
                ${results.warnings.length} warnings
              </span>
            ` : ''}
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
          <h4 style="margin: 0 0 12px 0; color: #aaa; font-size: 16px; display: flex; align-items: center;">
            <span style="color: #1877f2; margin-right: 8px;">✓</span>
            OpenGraph Tags
          </h4>
          ${renderSection(results.og.filter(t => t.isCritical), 'Critical')}
          ${renderSection(results.og.filter(t => t.isImportant), 'Important')}
          ${renderSection(results.og.filter(t => t.isRecommended), 'Recommended', true)}
        </div>
        
        <!-- Twitter Section -->
        <div style="background: ${CONFIG.colors.panel}; padding: 12px; border-radius: 8px;">
          <h4 style="margin: 0 0 12px 0; color: #aaa; font-size: 16px; display: flex; align-items: center;">
            <span style="color: #1da1f2; margin-right: 8px;">✓</span>
            Twitter Cards
          </h4>
          ${renderSection(results.twitter.filter(t => t.isCritical), 'Critical')}
          ${renderSection(results.twitter.filter(t => t.isImportant), 'Important')}
          ${renderSection(results.twitter.filter(t => t.isRecommended), 'Recommended', true)}
        </div>
      </div>
    `;

    // Debug info
    if (CONFIG.debug) {
      panelHTML += `
        <div style="background: #333; padding: 12px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #aaa; font-size: 16px;">Debug Info</h4>
          <div style="font-family: monospace; font-size: 12px; color: #ccc;">
            Found ${allMetaTags.length} meta tags<br>
            ${allMetaTags.slice(0, 20).map(m => 
              `&lt;meta ${m.getAttribute('property') ? `property="${m.getAttribute('property')}"` : ''} 
              ${m.getAttribute('name') ? `name="${m.getAttribute('name')}"` : ''} 
              content="${(m.getAttribute('content') || '').substring(0, 50)}${(m.getAttribute('content') || '').length > 50 ? '...' : ''}"&gt;`
            ).join('<br>')}
            ${allMetaTags.length > 20 ? `<br>...and ${allMetaTags.length - 20} more` : ''}
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
