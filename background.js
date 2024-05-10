chrome.action.onClicked.addListener(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageInfo,
    }, async (results) => {
      const { title, url } = results[0].result;
      const citation = generateIEEECitation(title, url);
  
      const bookmarks = await chrome.storage.sync.get('bookmarks');
      const newBookmarks = bookmarks.bookmarks || [];
      newBookmarks.push({ title, url, citation });
  
      await chrome.storage.sync.set({ bookmarks: newBookmarks });
    });
  });
  
  function getPageInfo() {
    const linkElements = document.getElementsByTagName('a');
    const currentUrl = window.location.href;
  
    for (const link of linkElements) {
      if (link.href === currentUrl) {
        const title = link.textContent || 'Untitled';
        const url = currentUrl;
        return { title, url };
      }
    }
  
    // If no matching link is found, use the page title and URL
    const title = document.title;
    const url = currentUrl;
    return { title, url };
  }
  
  function generateIEEECitation(title, url) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(title, 'text/html');
    const cleanTitle = doc.body.textContent || '';
  
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathArray = urlObj.pathname.split('/').filter(part => part !== '');
    const pathName = pathArray.length > 0 ? pathArray[pathArray.length - 1] : '';
  
    const currentYear = new Date().getFullYear();
    const accessedYear = currentYear;
  
    const author = 'Website';
    const citeTitle = `"${cleanTitle},"`;
    const citeUrl = `[Online]. Available: ${url}`;
    const citeAccessed = `[Accessed: ${accessedYear}]`;
  
    const citation = `${author}, ${citeTitle} ${citeUrl}. ${citeAccessed}`;
    return citation;
  }