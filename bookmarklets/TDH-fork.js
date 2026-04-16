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

    // Optimized whitespace removal
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

    // Optimized HTML cleanup
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

    // Output Title
    if (title) {
      alertStr += `<p><b class="link_sim" title="Copy title to clipboard">Title</b> <span ${(title.textContent.length < 30 || title.textContent.length > 150) ? "class='red'" : ''}>(${title.textContent.length}): </span>${title.textContent}</p>`;
    } else {
      alertStr += '<p><b class="red">Title: missing</b></p>';
    }

    // Output Description
    if (descr && descr.content) {
      alertStr += `<p><b class="link_sim" title="Copy description to clipboard">Description</b> <span ${(descr.content.length < 50 || descr.content.length > 250) ? "class='red'" : ''}>(${descr.content.length}): </span>${descr.content}</p>`;
    } else {
      alertStr += '<p><b class="red">Description: missing</b></p>';
    }

    // === NEW H1 LOGIC ===
    const h1s = code.querySelectorAll('h1').length ? code.querySelectorAll('h1') : document.querySelectorAll('h1');
    if (!h1s.length) {
      alertStr += '<p><b class="red">H1: missing</b></p>';
    } else if (h1s.length === 1) {
      alertStr += `<p><b>H1:</b> ${h1s[0].textContent.trim()}</p>`;
    } else {
      const h1Texts = Array.from(h1s).map(h => h.textContent.trim()).join(' <b>|</b> ');
      alertStr += `<p><b class="red">H1 Multiple (${h1s.length}):</b> <span class="red">${h1Texts}</span></p>`;
    }
    // =======================

    if (keyw && keyw.content) alertStr += `<p><b>Keywords</b> (${keyw.content.length}): ${keyw.content}</p>`;

    meta.forEach(m => {
      const name = m.name.toLowerCase();
      if (['robots', 'yandex', 'googlebot'].includes(name)) {
        const isClosed = m.content.includes('noindex') || m.content.includes('nofollow');
        alertStr += `<p><b>meta ${name}:</b> ${isClosed ? `<b class='red'>${m.content}</b>` : m.content}</p>`;
      }
    });

    if (canonical) {
      const href = canonical.getAttribute('href');
      alertStr += `<p><b>Canonical:</b> ${(href === location.href) ? `<a href='${href}'>${href}</a>` : `<a href='${href}'><b class='red'>${href}</b></a>`}</p>`;
    }

    if (rnext) alertStr += `<p><b>rel=next: </b><a href="${rnext.href}">${rnext.href}</a></p>`;
    if (rprev) alertStr += `<p><b>rel=prev: </b><a href="${rprev.href}">${rprev.href}</a></p>`;

    if (bcnt.length) alertStr += `<p><b>b count:</b> ${bcnt.length}</p>`;
    if (strong.length) alertStr += `<p><b>strong count:</b> ${strong.length}</p>`;
    if (em.length) alertStr += `<p><b>em count:</b> ${em.length}</p>`;

    if (comment.length) {
      const commentLen = comment.reduce((acc, c) => acc + c.length, 0);
      const maxCommentLen = Math.max(...comment.map(c => c.length - 7));
      alertStr += `<p><b>HTML comments
