// ==UserScript==
// @name         Hugging Face Chat Download Button
// @namespace    Violentmonkey Script
// @version      1.0
// @description  Adds a download button to download the JSON data from Hugging Face chat conversations.
// @author       Huggingchat Export
// @match        https://huggingface.co/chat/conversation/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to create the download button
    function createDownloadButton() {
        const button = document.createElement('button');
        button.innerText = 'Download JSON';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.padding = '10px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            const chatId = window.location.pathname.split('/').pop();
            const jsonUrl = `https://huggingface.co/chat/conversation/${chatId}/__data.json?x-sveltekit-invalidated=01`;

            fetch(jsonUrl)
                .then(response => response.json())
                .then(data => {
                    console.log('Fetched JSON data:', data); // Print the fetched JSON data
                    // Extract the title from the JSON data
                    const title = extractTitle(data);
                    console.log('Extracted title:', title); // Print the extracted title
                    const fileName = `${title}.json`;

                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                })
                .catch(error => console.error('Error downloading JSON:', error));
        });

        document.body.appendChild(button);
    }

    // Function to extract the title from the JSON data
    function extractTitle(data) {
        // Traverse the nodes to find the title
        for (const node of data.nodes) {
            console.log('Checking node:', node); // Print the current node being checked
            if (node.type === 'data') {
                const titleIndex = findTitleIndex(node.data);
                if (titleIndex !== null) {
                    console.log('Found title index:', titleIndex); // Print the found title index
                    return node.data[titleIndex];
                }
            }
        }
        return 'Untitled'; // Default title if not found
    }

    // Function to find the title index in the data array
    function findTitleIndex(data) {
        for (const item of data) {
            console.log('Checking item:', item); // Print the current item being checked
            if (item && item.title !== undefined) {
                console.log('Found title item:', item); // Print the found title item
                return item.title;
            }
        }
        return null; // Return null if title index is not found
    }

    // Create the download button when the page loads
    createDownloadButton();
})();
