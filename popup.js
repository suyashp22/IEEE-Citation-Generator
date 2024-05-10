chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => document.documentElement.outerHTML,
  }).then((result) => {
    const citation = generateCitation(result[0].result);
    
    // Add event listener to the save button
    const saveButton = document.getElementById('save-citation');
    saveButton.addEventListener('click', () => {
        const citation = document.getElementById('citation').textContent; 
        const title = extractTitleFromCitation(citation);
        const url = tabs[0].url;
        saveCitationAndLink(citation, title, url);
    });

    const copyButton = document.getElementById('copy-button');
    copyButton.addEventListener('click', () => {
      const textarea = document.createElement('textarea');
      textarea.value = citation;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Citation copied to clipboard!');
    });
  }).catch((error) => {
    console.error('Error executing script:', error);
  });
});

function generateCitation(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const authors = Array.from(doc.querySelectorAll('meta[name^="parsely-author"]')).map(
      (author, index, array) => {
        const nameParts = author.content.split(" ");
        if (nameParts.length > 1) {
          return nameParts[0].charAt(0) + ". " + nameParts[nameParts.length - 1];
        } else {
          return nameParts[0];
        }
      }
    );

    const lastAuthor = authors.pop();
    let authorString = "";
    if (authors.length > 0) {
      authorString = authors.join(', ');
      if (authors.length > 1) {
        authorString += " and";
      }
      authorString += " " + lastAuthor;
    } else {
      authorString = lastAuthor;
    }

    const titleMeta = doc.querySelector('meta[name="parsely-title"]');
    const title = titleMeta ? titleMeta.content.split(' | ')[0] : "Untitled";

    const journalElement = doc.querySelector('.stats-document-abstract-publishedIn');
    let journal = journalElement ? journalElement.textContent.trim().split(': ')[1].split(' (')[0] : "Unknown Journal";

    const volumeElement = doc.querySelector('.stats-document-abstract-publishedIn > span');
    let volume = volumeElement ? volumeElement.textContent.trim().split(': ')[1] || undefined : undefined;
    if (volume) {
        volume = volume.match(/\d+/g)?.[0]; // Extract consecutive numbers
    }

    const issueElement = doc.querySelector('.stats-document-abstract-publishedIn-issue');
    let issue = issueElement ? issueElement.textContent.trim().split(': ')[1] || undefined : undefined;
    if (issue) {
        issue = issue.match(/\d+/g)?.[0]; // Extract consecutive numbers
    }
    
    const doiElement = doc.querySelector('.stats-document-abstract-doi a');
    const doi = doiElement ? doiElement.textContent.trim() : "Unknown";

    const pagesElement = doc.querySelectorAll('.u-pb-1');
    let pagesStart = "Unknown", pagesEnd = "Unknown";
    for (const element of pagesElement) {
        const text = element.textContent.trim();
        if (text.includes('Page(s):')) {
            const pages = text.split(':')[1].split('-');
            pagesStart = parseInt(pages[0].trim()) || "Unknown";
            pagesEnd = parseInt(pages[1].trim()) || "Unknown";
            break;
        }
    }

    const yearElement = doc.querySelector('div.doc-abstract-pubdate');
    const year = yearElement ? yearElement.textContent.split(':')[1]?.trim().slice(-4) || "Unknown" : "Unknown";

    let citation = `${authorString}, "${title}," in <em>${journal}</em>,`;
    if (volume) {
        citation += ` vol. ${volume},`;
    }
    if (issue) {
        citation += ` no. ${issue},`;
    }
    citation += ` pp. ${pagesStart}-${pagesEnd}, ${year}, doi: ${doi}.`;
    document.getElementById('citation').innerHTML = citation;
    return citation;
  } catch (error) {
    console.error('Error generating citation:', error);
    return "Error generating citation";
  }
}

// Function to save the citation, title, and website link
function saveCitationAndLink(citation, title, url) {
  chrome.storage.sync.get('savedCitations', (data) => {
      const savedCitations = data.savedCitations || [];
      savedCitations.push({ citation: citation, title: title, url: url });
      chrome.storage.sync.set({ savedCitations }, () => {
          console.log('Citation, title, and link saved successfully!');
      });
  });
}

function extractTitleFromCitation(citation) {
  const titleStartIndex = citation.indexOf('"') + 1; 
  const titleEndIndex = citation.indexOf('"', titleStartIndex); 
  if (titleStartIndex !== -1 && titleEndIndex !== -1) {
    let extractedTitle = citation.substring(titleStartIndex, titleEndIndex).trim();
    if (extractedTitle.endsWith(',')) {
        extractedTitle = extractedTitle.slice(0, -1); // Remove the comma if it's at the end of the title
    }
    return extractedTitle;
  } else {
      return "Unknown"; // Return a default value if the title cannot be extracted
  }
}