// Function to display saved citations
function displaySavedCitations() {
    chrome.storage.sync.get('savedCitations', (data) => {
        const savedCitations = data.savedCitations || [];
        const savedCitationsDiv = document.getElementById('saved-citations');
        savedCitationsDiv.innerHTML = '';
        savedCitations.forEach((item, index) => {
            const citationItem = document.createElement('div');
            citationItem.classList.add('citation-item');
            const titleElement = document.createElement('h3');
            titleElement.textContent = 'Title: ' + item.title;
            const linkElement = document.createElement('p');
            const linkAnchor = document.createElement('a');
            linkAnchor.classList.add('citation-link');
            linkAnchor.href = item.url;
            linkAnchor.textContent = 'Link';
            linkElement.appendChild(linkAnchor);
            const citationParagraph = document.createElement('p');
            citationParagraph.innerHTML = 'Citation: ' + item.citation;
            
            // Add a delete button for each citation
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteCitation(index);
            });

            // Add a copy icon button for each citation
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', () => {
                copyCitation(item.citation);
            });

            citationItem.appendChild(titleElement);
            citationItem.appendChild(linkElement);
            citationItem.appendChild(citationParagraph);
            citationItem.appendChild(deleteButton);
            citationItem.appendChild(copyButton);
            savedCitationsDiv.appendChild(citationItem);
        });
    });
}

// Call the function to display saved citations when the page loads
document.addEventListener('DOMContentLoaded', displaySavedCitations);

// Function to copy citation to clipboard
function copyCitation(citation) {
    const textarea = document.createElement('textarea');
    textarea.value = citation;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Citation copied to clipboard!');
}

// Function to delete individual citation
function deleteCitation(index) {
    chrome.storage.sync.get('savedCitations', (data) => {
        const savedCitations = data.savedCitations || [];
        savedCitations.splice(index, 1); // Remove the citation at the specified index
        chrome.storage.sync.set({ savedCitations }, () => {
            console.log('Citation deleted successfully!');
            displaySavedCitations(); // Refresh the displayed citations
        });
    });
}

// Event listener for the "Delete All" button
document.getElementById('delete-all').addEventListener('click', () => {
    chrome.storage.sync.remove('savedCitations', () => {
        console.log('All citations deleted successfully!');
        displaySavedCitations(); // Refresh the displayed citations
    });
});
