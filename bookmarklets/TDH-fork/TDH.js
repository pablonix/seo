(() => {
  const XHR = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
  const xhr = new XHR();
  xhr.open('GET', window.location.href, true);
  xhr.send();
  
  xhr.onload = () => {
    let code = xhr.responseText;
    if (!code) {
      alert('Failed to retrieve page code.');
      return;
    }
    
    const parser = new DOMParser();
    code = parser.parseFromString(code, 'text/html');
    const script = code.querySelectorAll('script');
    const codeBody = code.getElementsByTagName('body')[0];
    
    if (!codeBody) {
      alert('Validation failed due to HTML errors. Please check page validity.');
      return;
    }

    let bodyText = codeBody.innerText.replace(/[\r\n\t]/gi, ' ').replace(/\s+/g, ' ');
    
    const comment = [];
    const iterator = document.createNodeIterator(code, NodeFilter.SHOW_COMMENT, () => NodeFilter.FILTER_ACCEPT, false);
    let curNode;
    while ((curNode = iterator.nextNode())) comment.push(curNode.nodeValue);

    let h = codeBody.querySelectorAll('h1, h2, h3, h4, h5, h6') || [];
    const hd = Array.from(h).map(el => ({
      head: Number(el.localName[1]),
      text: el.textContent
    }));

    const tempHeaders = [];
    let hErr = false;
    for (let i = 0; i < hd.length; i++) {
      hd[i].error = '';
      if (i === 0 && hd[0].head !== 1) {
        hd[0].error = 'First heading is not H1. ';
        tempHeaders[hd[0].head] = true;
        hErr = true;
        continue;
      }
      if (hd[i].head === 1 && tempHeaders[1]) hd[i].error += 'More than one H1 heading. ';
      if (hd[i].head === 1 && tempHeaders.slice(2).some(Boolean)) hd[i].error += 'Not the first heading in hierarchy. ';
      if (hd[i].head !== 1 && !tempHeaders[hd[i].head - 1]) hd[i].error += 'Missing higher-level heading before this one. ';
      if (hd[i - 1] && (hd[i].head - hd[i - 1].head > 1)) hd[i].error += 'Breaks heading hierarchy. ';
      if (hd[i].text.replace(/\s|&nbsp;/gi, '') === '') hd[i].error += 'Empty heading.';
      
      tempHeaders[hd[i].head] = true;
      if (hd[i].error) hErr = true;
    }

    let alertStr = '';
    let descr = code.querySelector('meta[name=description]') || document.querySelector('meta[name=description]');
    let keyw = code.querySelector('meta[name=keywords]') || document.querySelector('meta[name=keywords]');
    const meta = code.querySelectorAll('meta') || document.querySelectorAll('meta');
    const bcnt = codeBody.querySelectorAll('b');
    const strong = codeBody.querySelectorAll('strong');
    const em = codeBody.querySelectorAll('em');
    const links = codeBody.querySelectorAll('a');
    
    let externalLinks = '', internalLinks = '', altTitle = '', h16Str = '';
    let externalLinksCnt = 0, internalLinksCnt = 0, altCnt = 0, altStrCnt = 0;
    
    const img = codeBody.querySelectorAll('img');
    const titleAttr = codeBody.querySelectorAll('body [title]');
    let canonical = code.querySelector('link[rel=canonical]') || document.querySelector('head link[rel=canonical]');
    let rnext = code.querySelector('link[rel=next]') || document.querySelector('link[rel=next]');
    let rprev = code.querySelector('link[rel=prev]') || document.querySelector('link[rel=prev]');
    const title = code.querySelector('title') || document.querySelector('title');

    let codeScriptsDel = codeBody.cloneNode(true);
    const codeClear = (element) => {
      Array.from(element.children).forEach(tag => {
        if (['script', 'style', 'noscript'].includes(tag.nodeName.toLowerCase())) {
          tag.innerHTML = '';
        } else {
          for (let a = tag.attributes.length - 1; a >= 0; a--) {
            const attrName = tag.attributes[a].name;
            if (attrName !== 'src' && attrName !== 'href') tag.removeAttribute(attrName);
          }
          if (tag.children.length > 0) codeClear(tag);
        }
      });
      return element;
    };
    codeScriptsDel = codeClear(codeScriptsDel);

    if (title) {
      alertStr += "<p><b class='link_sim' title='Copy title to clipboard'>Title</b> <span " + ((title.textContent.length < 30 || title.textContent.length > 150) ? "class='red'" : "") + ">(" + title.textContent.length + "): </span>" + title.textContent + "</p>";
    } else {
      alertStr += "<p><b class='red'>Title: missing</b></p>";
    }

    if (descr && descr.content) {
      alertStr += "<p><b class='link_sim' title='Copy description to clipboard'>Description</b> <span " + ((descr.content.length < 50 || descr.content.length > 250) ? "class='red'" : "") + ">(" + descr.content.length + "): </span>" + descr.content + "</p>";
    } else {
      alertStr += "<p><b class='red'>Description: missing</b></p>";
    }

    const h1s = code.querySelectorAll('h1').length ? code.querySelectorAll('h1') : document.querySelectorAll('h1');
    if (!h1s.length) {
      alertStr += "<p><b class='red'>H1: missing</b></p>";
    } else if (h1s.length === 1) {
      alertStr += "<p><b>H1:</b> " + h1s[0].textContent.trim() + "</p>";
    } else {
      const h1Texts = Array.from(h1s).map(h => h.textContent.trim()).join(' <b>|</b> ');
      alertStr += "<p><b class='red'>H1 Multiple (" + h1s.length + "):</b> <span class='red'>" + h1Texts + "</span></p>";
    }

    if (keyw && keyw.content) alertStr += "<p><b>Keywords</b> (" + keyw.content.length + "): " + keyw.content + "</p>";

    meta.forEach(m => {
      const name = m.name.toLowerCase();
      if (['robots', 'yandex', 'googlebot'].includes(name)) {
        const isClosed = m.content.includes('noindex') || m.content.includes('nofollow');
        alertStr += "<p><b>meta " + name + ":</b> " + (isClosed ? "<b class='red'>" + m.content + "</b>" : m.content) + "</p>";
      }
    });

    if (canonical) {
      const href = canonical.getAttribute('href');
      alertStr += "<p><b>Canonical:</b> " + ((href === location.href) ? "<a href='" + href + "'>" + href + "</a>" : "<a href='" + href + "'><b class='red'>" + href + "</b></a>") + "</p>";
    }

    if (rnext) alertStr += "<p><b>rel=next: </b><a href='" + rnext.href + "'>" + rnext.href + "</a></p>";
    if (rprev) alertStr += "<p><b>rel=prev: </b><a href='" + rprev.href + "'>" + rprev.href + "</a></p>";

    if (bcnt.length) alertStr += "<p><b>b count:</b> " + bcnt.length + "</p>";
    if (strong.length) alertStr += "<p><b>strong count:</b> " + strong.length + "</p>";
    if (em.length) alertStr += "<p><b>em count:</b> " + em.length + "</p>";

    if (comment.length) {
      const commentLen = comment.reduce((acc, c) => acc + c.length, 0);
      const maxCommentLen = Math.max(...comment.map(c => c.length - 7));
      alertStr += "<p><b>HTML comments:</b> <span title='Count'>" + comment.length + "</span> | <span title='Characters'>" + commentLen + "</span> | <span title='Max length'>" + maxCommentLen + "</span></p>";
    }

    if (script.length) {
      const scriptLen = Array.from(script).reduce((acc, s) => acc + s.textContent.length, 0);
      alertStr += "<p><b>JS scripts:</b> <span title='Count'>" + script.length + "</span> | <span title='Characters'>" + scriptLen + "</span></p>";
    }

    const linksTempArr = new Set();
    links.forEach(link => {
      const lh = link.href.split('#')[0];
      if (linksTempArr.has(lh)) return;
      let l = lh;
      try { l = decodeURIComponent(lh); } catch (e) {}
      
      const nofollow = link.rel.includes('nofollow') ? "&nbsp;&nbsp;—&nbsp;&nbsp;<b style='text-decoration:underline;'>nofollow</b>" : "";
      const listItem = "<li><a href='" + lh + "' target='_blank'>" + l + "</a>" + nofollow + "</li>";
      
      if (location.hostname === link.hostname) {
        internalLinksCnt++;
        linksTempArr.add(lh);
        internalLinks += listItem;
      } else if (lh.startsWith('http')) {
        externalLinksCnt++;
        linksTempArr.add(lh);
        externalLinks += listItem;
      }
    });

    img.forEach(i => {
      if (i.alt) {
        altCnt++; altStrCnt += i.alt.length;
        altTitle += "<li><b>alt</b> — " + i.alt + "</li>";
      }
    });

    titleAttr.forEach(t => {
      if (t.title) {
        altCnt++; altStrCnt += t.title.length;
        altTitle += "<li><b>title</b> — " + t.title + "</li>";
      }
    });

    alertStr += "<p><b>alt + title:</b> <span title='Attribute length (characters)'>" + altStrCnt + "</span></p>";
    alertStr += "<p><b>Text length:</b> <span title='Without spaces'>" + bodyText.replace(/\s/g, '').length + "</span> | <span title='With spaces'>" + bodyText.length + "</span></p>";

    hd.forEach(h => {
      h16Str += "<li style='margin-left:" + ((h.head - 1) * 20) + "px'" + (h.error ? " class='red' title='" + h.error + "'" : "") + "><span>H" + h.head + " - " + h.text + "</span></li>";
    });

    let openLinks = "<p>" +
      "<b class='openLinksB' data='pxexternallinks'>External Links (" + externalLinksCnt + ")</b>&nbsp;&nbsp;|&nbsp;&nbsp;" +
      "<b class='openLinksB' data='pxinternallinks'>Internal Links (" + internalLinksCnt + ")</b>&nbsp;&nbsp;|&nbsp;&nbsp;" +
      "<b class='openLinksB' data='pxalttitlelinks'>Img alt/title (" + altCnt + ")</b>&nbsp;&nbsp;|&nbsp;&nbsp;" +
      "<b class='openLinksB' data='pxh16links'>H1-H6 " + (hErr ? "<span class='red'>(" + hd.length + ")</span>" : "(" + hd.length + ")") + "</b>&nbsp;&nbsp;|&nbsp;&nbsp;" +
      "<b class='openLinksB' data='pxtext'>Text</b>" +
    "</p>";

    const topBS = document.createElement('style');
    topBS.textContent = ".pixelTopBlockWrp {position:relative;width:100%;top:0;left:0;background:#131722;z-index:999999;text-align:left;border-bottom:1px solid #2a2e39;color:#b2b5be;font-family:Segoe UI, Arial, sans-serif;max-height:50%;overflow-y:auto;box-shadow: 0 4px 12px rgba(0,0,0,0.5);} .pixelTopBlockWrp .close {float:right;cursor:pointer;color:#b2b5be;font-size:24px;line-height:0;padding:8px 0 0; transition: color 0.2s;} .pixelTopBlockWrp .close:hover {color:#f23645;} .topBlock {padding:10px 15px;font-size:14px;line-height:16px;} .topBlock p {margin:0 0 0.4em 0 !important;padding:0;line-height:1.3em;font-size:14px;color:#d1d4dc;} .pxtblocklinks OL {margin:0 15px;padding:0 0 0 40px;list-style:decimal;display:none;} .pxtblocklinks OL LI {color:#b2b5be;margin-bottom:4px;display:block;font-size:14px;} .pxtblocklinks {width:80%;left:10%;position:relative;background:#1e222d;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.8);font-size:14px;word-wrap:break-word; border-radius: 0 0 6px 6px; border: 1px solid #2a2e39; border-top: none;} .pxexternallinks, .pxinternallinks, .pxalttitlelinks, .pxh16links {margin:0 15px;padding:15px 0 15px 20px;list-style:decimal;display:none;max-height:500px;overflow:auto;} .pxh16links span:hover {cursor:pointer;border-bottom:1px solid #2962ff;color:#2962ff;} .openLinksB {border-bottom:1px dashed #5d606b;cursor:pointer; transition: color 0.2s;} .openLinksB:hover {border-bottom:none;color:#ffffff;} .pixelTopBlockWrp b {color:#ffffff;font-weight:600;} .pxtblocklinks a, .topBlock a {color:#2962ff;text-decoration:none;} .pxtblocklinks a:hover {border-bottom:1px solid #2962ff;} .topBlock .red, .pxtblocklinks .red {color:#f23645 !important;} .link_sim {text-decoration:underline;cursor:pointer;} .link_sim:hover {text-decoration:none;color:#2962ff;} .pxtext {margin:0 15px;padding:15px 20px !important;display:none;max-height:500px;overflow:auto;}";
    document.body.appendChild(topBS);

    const topBlock = document.createElement('div');
    topBlock.className = 'pixelTopBlockWrp';
    topBlock.innerHTML = "<div class='topBlock'><b class='close' title='Close'>\u00d7</b>" + alertStr + openLinks + "</div>";

    const linksData = document.createElement('div');
    linksData.className = 'pxtblocklinks';
    linksData.innerHTML = "<ol class='pxexternallinks'>" + externalLinks + "</ol><ol class='pxinternallinks'>" + internalLinks + "</ol><ol class='pxalttitlelinks'>" + altTitle + "</ol><ol class='pxh16links' style='list-style:none;'>" + h16Str + "</ol><div class='pxtext'>" + codeScriptsDel.innerHTML + "</div>";

    const block = document.createElement('div');
    block.style = 'position:fixed;z-index:9999999999999;width:100%;top:0px;left:0px;';
    block.className = 'pxtagblock';
    block.appendChild(topBlock);
    block.appendChild(linksData);
    document.body.insertBefore(block, document.body.firstChild);

    document.querySelector('.pxtagblock .close').onclick = () => document.body.removeChild(block);

    document.querySelectorAll('.pxtagblock .link_sim').forEach(btn => {
      btn.onclick = (e) => {
        const ta = document.createElement('textarea');
        document.body.appendChild(ta);
        ta.value = e.target.parentNode.lastChild.textContent;
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        
        const origText = e.target.textContent;
        e.target.textContent = 'Copied!';
        e.target.style.color = '#089981';
        setTimeout(() => { e.target.textContent = origText; e.target.style.color = ''; }, 1000);
      };
    });

    const pxtblocklinks = document.querySelectorAll('.pxtblocklinks > *');
    document.querySelectorAll('.pxtagblock .openLinksB').forEach(btn => {
      btn.onclick = (e) => {
        const targetClass = e.target.getAttribute('data');
        pxtblocklinks.forEach(block => {
          if (block.className !== targetClass) {
            block.classList.remove('active');
            block.style.display = 'none';
          } else {
            const isActive = block.classList.contains('active');
            block.classList.toggle('active', !isActive);
            block.style.display = isActive ? 'none' : 'block';
          }
        });
      };
    });
  };
})();
