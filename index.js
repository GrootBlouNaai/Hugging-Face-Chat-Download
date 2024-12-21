// ==UserScript==
// @name         Hugging Face Chat Download
// @namespace    Violentmonkey Script
// @version      1.0
// @description  Adds buttons to download JSON and Markdown
// @author       Huggingchat Export
// @match        https://huggingface.co/chat/conversation/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to create the download buttons
    function createDownloadButtons() {
        const jsonButton = createButton('Download JSON', '#4CAF50', '15px');
        const markdownButton = createButton('Download Markdown', '#008CBA', '60px');

        jsonButton.addEventListener('click', () => downloadData('json'));
        markdownButton.addEventListener('click', () => downloadData('markdown'));

        document.body.appendChild(jsonButton);
        document.body.appendChild(markdownButton);
    }

    function createButton(text, backgroundColor, bottom) {
        const button = document.createElement('button');
        button.innerText = text;
        button.style.position = 'fixed';
        button.style.bottom = bottom;
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.padding = '10px';
        button.style.backgroundColor = backgroundColor;
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        return button;
    }

    function downloadData(type) {
        const chatId = window.location.pathname.split('/').pop();
        const jsonUrl = `https://huggingface.co/chat/conversation/${chatId}/__data.json?x-sveltekit-invalidated=01`;

        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched JSON data:', data);
                const title = extractTitle(data);
                // const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
                const sanitizedTitle = title; // Commented out filename sanitization
                console.log('Extracted title:', sanitizedTitle);

                if (type === 'json') {
                    const fileName = `${sanitizedTitle}.json`;
                    downloadJSON(data, fileName);
                } else if (type === 'markdown') {
                    const fileName = `${sanitizedTitle}.md`;
                    const conversation = extractConversation(data);
                    downloadMarkdown(conversation.join(''), fileName);
                }
            })
            .catch(error => console.error('Error downloading data:', error));
    }

    function extractTitle(data) {
        if (data && data.nodes && Array.isArray(data.nodes)) {
            for (const node of data.nodes) {
                if (node && node.type === 'data' && Array.isArray(node.data)) {
                    for (const item of node.data) {
                        if (item && typeof item === 'object' && item.title !== undefined) {
                            const titleValue = getTitleValue(node.data, item.title);
                            if (typeof titleValue === 'string' && titleValue.trim() !== '') {
                                return titleValue;
                            }
                        }
                    }
                }
            }
        }
        return 'Untitled';
    }

    function getTitleValue(data, titleIndex) {
        if (typeof titleIndex === 'number' && titleIndex < data.length) {
            return data[titleIndex];
        }
        return null;
    }

    function downloadJSON(data, fileName) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadMarkdown(conversation, fileName) {
        const blob = new Blob([conversation], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function extractConversation(data) {
        let conversation = [];
        let allData = [];

        if (data && data.nodes && Array.isArray(data.nodes)) {
            for (const node of data.nodes) {
                if (node && node.type === 'data' && Array.isArray(node.data)) {
                    allData = node.data;
                }
            }
        }

        function traverse(obj) {
            if (Array.isArray(obj)) {
                obj.forEach(item => traverse(item));
            } else if (typeof obj === 'object' && obj !== null) {
                if ('from' in obj && 'content' in obj) {
                    const fromIndex = obj.from;
                    const contentIndex = obj.content;

                    if (typeof fromIndex === 'number' && typeof contentIndex === 'number' &&
                        fromIndex < allData.length && contentIndex < allData.length) {
                        const role = allData[fromIndex];
                        const content = allData[contentIndex];

                        if (role && content && ['user', 'assistant'].includes(role) && typeof content === 'string') {
                            conversation.push(`### **${role.charAt(0).toUpperCase() + role.slice(1)}**: \n${content}\n\n`);
                        }
                    }
                }

                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        traverse(obj[key]);
                    }
                }
            }
        }

        if (data && data.nodes && Array.isArray(data.nodes)) {
            data.nodes.forEach(node => {
                if (node && node.type === 'data' && Array.isArray(node.data)) {
                    traverse(node);
                }
            });
        }

        return conversation;
    }

    // Create the download button when the page loads or when a new chat is loaded
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                createDownloadButtons();
                observer.disconnect(); // Stop observing once buttons are created
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
