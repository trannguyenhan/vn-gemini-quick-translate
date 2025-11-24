// content.js - Hiển thị popup khi chọn text và kết quả trên trang web

let actionPopup = null;
let resultPopup = null;

function showActionPopup(x, y, selectedText) {
    hideActionPopup(); // Luôn ẩn popup cũ trước khi hiển thị cái mới

    actionPopup = document.createElement('div');
    actionPopup.id = 'gemini-quick-translate-action-popup';

    // Ước lượng kích thước của popup
    const popupWidth = 230;
    const popupHeight = 50;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Khoảng cách mong muốn từ con trỏ chuột
    const offsetX = 15;
    const offsetY = 15;

    // Tính toán vị trí ban đầu (ưu tiên dưới-phải con trỏ)
    let finalLeft = x + offsetX;
    let finalTop = y + offsetY;

    // Kiểm tra và điều chỉnh nếu popup vượt ra ngoài cạnh phải của viewport
    if (finalLeft + popupWidth > viewportWidth) {
        finalLeft = x - popupWidth - offsetX;
    }

    // Kiểm tra và điều chỉnh nếu popup vượt ra ngoài cạnh dưới của viewport
    if (finalTop + popupHeight > viewportHeight) {
        finalTop = y - popupHeight - offsetY;
    }

    // Đảm bảo popup không vượt ra ngoài cạnh trái viewport
    if (finalLeft < 5) {
        finalLeft = 5;
    }

    // Đảm bảo popup không vượt ra ngoài cạnh trên viewport
    if (finalTop < 5) {
        finalTop = 5;
    }

    // Các kiểm tra cuối cùng
    if (finalLeft + popupWidth > viewportWidth - 5) {
        finalLeft = viewportWidth - popupWidth - 5;
        if (finalLeft < 5) finalLeft = 5;
    }
    if (finalTop + popupHeight > viewportHeight - 5) {
        finalTop = viewportHeight - popupHeight - 5;
        if (finalTop < 5) finalTop = 5;
    }

    actionPopup.style.left = `${finalLeft}px`;
    actionPopup.style.top = `${finalTop}px`;
    
    // Thêm class để trigger animation
    setTimeout(() => {
        actionPopup.style.opacity = '1';
    }, 10);

    const askAIButton = document.createElement('button');
    askAIButton.textContent = '✨ Hỏi AI';
    askAIButton.addEventListener('click', () => {
        const currentSelection = window.getSelection().toString().trim();
        if (currentSelection) {
            showResultPopup("Đang hỏi AI...", true);
            chrome.runtime.sendMessage({ type: "ASK_GEMINI", text: currentSelection }, handleResponse);
        }
        hideActionPopup();
    });

    const translateButton = document.createElement('button');
    translateButton.textContent = '🌐 Dịch';
    translateButton.addEventListener('click', () => {
        const currentSelection = window.getSelection().toString().trim();
        if (currentSelection) {
            chrome.storage.local.get(["targetLanguage"], (result) => {
                const targetLang = result.targetLanguage || "Vietnamese";
                showResultPopup("Đang dịch...", true);
                chrome.runtime.sendMessage({ 
                    type: "TRANSLATE_GEMINI", 
                    text: currentSelection, 
                    targetLang: targetLang 
                }, handleResponse);
            });
        }
        hideActionPopup();
    });

    actionPopup.appendChild(askAIButton);
    actionPopup.appendChild(translateButton);
    document.body.appendChild(actionPopup);
}

function hideActionPopup() {
    if (actionPopup) {
        // Thêm animation fade out trước khi remove
        actionPopup.style.animation = 'popupFadeOut 0.2s ease-out forwards';
        setTimeout(() => {
            if (actionPopup) {
                actionPopup.remove();
                actionPopup = null;
            }
        }, 200);
    }
}

function showResultPopup(titleText, isLoading = false) {
    hideResultPopup();

    resultPopup = document.createElement('div');
    resultPopup.id = 'gemini-quick-translate-result-popup';

    const header = document.createElement('div');
    header.id = 'gemini-quick-translate-result-popup-header';

    const title = document.createElement('h3');
    title.textContent = titleText;

    const closeButton = document.createElement('button');
    closeButton.id = 'gemini-quick-translate-result-popup-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', hideResultPopup);

    header.appendChild(title);
    header.appendChild(closeButton);

    const content = document.createElement('div');
    content.id = 'gemini-quick-translate-result-popup-content';
    if (isLoading) {
        content.classList.add('loading');
        const spinner = document.createElement('div');
        spinner.className = 'gqt-spinner';
        content.appendChild(spinner);
    }

    resultPopup.appendChild(header);
    resultPopup.appendChild(content);
    document.body.appendChild(resultPopup);
}

function hideResultPopup() {
    if (resultPopup) {
        // Thêm animation fade out trước khi remove
        resultPopup.style.animation = 'resultPopupFadeOut 0.25s ease-out forwards';
        setTimeout(() => {
            if (resultPopup) {
                resultPopup.remove();
                resultPopup = null;
            }
        }, 250);
    }
}

// Function để parse markdown thành HTML
function parseMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Xử lý lists trước (để không bị ảnh hưởng bởi bold/italic)
    const lines = html.split('\n');
    let inList = false;
    let listItems = [];
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const listMatch = line.match(/^[\*\-]\s+(.+)$/);
        
        if (listMatch) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(listMatch[1]);
        } else {
            if (inList) {
                processedLines.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
                listItems = [];
                inList = false;
            }
            processedLines.push(line);
        }
    }
    
    if (inList && listItems.length > 0) {
        processedLines.push('<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>');
    }
    
    html = processedLines.join('\n');
    
    // Xử lý bold và italic - phải xử lý bold trước (vì nó dài hơn)
    // Bold __text__ (2 dấu gạch dưới) - xử lý trước để tránh conflict
    html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    // Bold **text** (2 dấu sao)
    html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic _text_ (1 dấu gạch dưới, không phải 2)
    // Chỉ match khi không có dấu gạch dưới liền kề
    html = html.replace(/([^_])_([^_\n]+?)_([^_])/g, '$1<em>$2</em>$3');
    html = html.replace(/^_([^_\n]+?)_([^_])/gm, '<em>$1</em>$2');
    html = html.replace(/([^_])_([^_\n]+?)_$/gm, '$1<em>$2</em>');
    
    // Italic *text* (1 dấu sao, không phải 2)
    // Chỉ match khi không có dấu sao liền kề
    html = html.replace(/([^*])\*([^*\n]+?)\*([^*])/g, '$1<em>$2</em>$3');
    html = html.replace(/^\*([^*\n]+?)\*([^*])/gm, '<em>$1</em>$2');
    html = html.replace(/([^*])\*([^*\n]+?)\*$/gm, '$1<em>$2</em>');
    
    // Code `text`
    html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Xử lý paragraphs và line breaks
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
        p = p.trim();
        if (!p) return '';
        // Nếu đã là HTML tag thì không wrap
        if (p.startsWith('<')) {
            return p;
        }
        // Thay \n thành <br>
        p = p.replace(/\n/g, '<br>');
        return `<p>${p}</p>`;
    }).filter(p => p).join('');
    
    return html;
}

function handleResponse(response) {
    const contentDiv = document.getElementById('gemini-quick-translate-result-popup-content');
    const titleH3 = document.querySelector('#gemini-quick-translate-result-popup-header h3');

    if (!contentDiv || !titleH3) {
        if (response && response.error) {
            console.error("[Gemini Quick Translate] Error (result popup DOM not found):", response.error);
        }
        return;
    }

    contentDiv.classList.remove('loading');
    const spinner = contentDiv.querySelector('.gqt-spinner');
    if(spinner) spinner.remove();

    if (response && response.success && response.data) {
        contentDiv.innerHTML = parseMarkdown(response.data);
        if (response.actionType === "ASK_GEMINI") {
            titleH3.textContent = "Kết quả từ AI Gemini:";
        } else if (response.actionType === "TRANSLATE_GEMINI") {
            titleH3.textContent = "Bản dịch:";
        }
    } else if (response && response.error) {
        contentDiv.innerHTML = `<span class="error">Lỗi: ${response.error}</span>`;
        titleH3.textContent = "Lỗi";
    } else {
        contentDiv.innerHTML = "<span class='error'>Không nhận được phản hồi hoặc có lỗi không xác định.</span>";
        titleH3.textContent = "Lỗi";
    }
}

// Mousedown listener
document.addEventListener('mousedown', (event) => {
    if (event.target.closest('#gemini-quick-translate-action-popup button')) {
        return;
    }
    if (event.target.closest('#gemini-quick-translate-result-popup-close-btn')) {
        return;
    }

    if (actionPopup && !actionPopup.contains(event.target)) {
        hideActionPopup();
    }

    if (resultPopup && !resultPopup.contains(event.target)) {
        hideResultPopup();
    }
});

// Biến để lưu trạng thái enable/disable
let enableQuickTranslate = true;

// Load setting khi content script khởi động
chrome.storage.local.get(["enableQuickTranslate"], (result) => {
    if (result.enableQuickTranslate !== undefined) {
        enableQuickTranslate = result.enableQuickTranslate;
    } else {
        enableQuickTranslate = true; // Mặc định bật
    }
});

// Lắng nghe thay đổi setting
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.enableQuickTranslate) {
        enableQuickTranslate = changes.enableQuickTranslate.newValue;
        // Ẩn popup nếu đang hiển thị và bị tắt
        if (!enableQuickTranslate) {
            hideActionPopup();
        }
    }
});

// Mouseup listener
document.addEventListener('mouseup', (event) => {
    if (event.target.closest('#gemini-quick-translate-action-popup button')) {
        return;
    }
    if (resultPopup && resultPopup.contains(event.target)) {
        return;
    }
    if (actionPopup && actionPopup.contains(event.target)) {
        // Let setTimeout handle
    }

    setTimeout(() => {
        // Kiểm tra setting trước khi hiển thị popup
        if (!enableQuickTranslate) {
            hideActionPopup();
            return;
        }

        const rawSelection = window.getSelection();
        const selectedText = rawSelection.toString().trim();

        const activeEl = document.activeElement;
        let isSelectionInEditableField = false;

        if (activeEl) {
            const tagName = activeEl.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || activeEl.isContentEditable) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (activeEl.contains(range.commonAncestorContainer)) {
                        isSelectionInEditableField = true;
                    }
                }
            }
        }

        if (selectedText && selectedText.length > 0 && !isSelectionInEditableField) {
            showActionPopup(event.clientX, event.clientY, selectedText);
        } else {
            hideActionPopup();
        }
    }, 0);
});

// Lắng nghe tin nhắn từ background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SHOW_GEMINI_RESULT_FROM_CONTEXT_MENU") {
        if (resultPopup) {
            hideResultPopup();
        }
        showResultPopup(request.title || "Kết quả:", request.isLoading);
        if (!request.isLoading) {
            handleResponse({
                success: request.success,
                data: request.data,
                error: request.error,
                actionType: request.actionType
            });
        }
        sendResponse({ status: "Result display process initiated in content script" });
    }
    return true;
});

