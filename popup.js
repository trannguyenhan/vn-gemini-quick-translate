const inputText = document.getElementById("inputText");
const askAIButton = document.getElementById("askAIButton");
const translateButton = document.getElementById("translateButton");
const resultDiv = document.getElementById("result");
const apiKeyErrorContainer = document.getElementById("apiKeyErrorContainer");
const openOptionsButton = document.getElementById("openOptionsButton");
const openOptionsButton2 = document.getElementById("openOptionsButton2");
const settingsSection = document.getElementById("settingsSection");
const clearApiKeyButton = document.getElementById("clearApiKeyButton");
const targetLanguageSelect = document.getElementById("targetLanguageSelect");

// Function để parse markdown thành HTML
function parseMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Xử lý lists trước (để không bị ảnh hưởng bởi bold/italic)
    // Unordered lists - * item hoặc - item (chỉ khi ở đầu dòng)
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
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
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

// Ẩn/hiện các thành phần chính của popup
function showTranslationUI() {
  inputText.style.display = "block";
  targetLanguageSelect.style.display = "block";
  askAIButton.style.display = "block";
  translateButton.style.display = "block";
  resultDiv.style.display = "block";
  apiKeyErrorContainer.style.display = "none";
  settingsSection.style.display = "block";
  inputText.focus(); // Tự động focus vào ô nhập liệu khi hiển thị UI dịch
}

function showApiKeyErrorUI() {
  inputText.style.display = "none";
  targetLanguageSelect.style.display = "none";
  askAIButton.style.display = "none";
  translateButton.style.display = "none";
  resultDiv.style.display = "none";
  apiKeyErrorContainer.style.display = "block";
  settingsSection.style.display = "none";
}

// Kiểm tra API Key và Model khi popup được mở
document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get(["geminiApiKey", "geminiApiModel", "targetLanguage"]);
  if (!data.geminiApiKey || !data.geminiApiModel) {
    showApiKeyErrorUI(); // Hiện thông báo lỗi nếu thiếu KEY hoặc Model
  } else {
    // Load ngôn ngữ đích đã lưu hoặc mặc định là Vietnamese
    if (data.targetLanguage) {
      targetLanguageSelect.value = data.targetLanguage;
    }
    showTranslationUI(); // Hiện UI dịch nếu có đủ KEY và Model
  }
});


// Nhận văn bản được chọn từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "selectedText" && request.text) {
    inputText.value = request.text;
  }
});

// Lắng nghe sự kiện nhấn nút dịch
translateButton.addEventListener("click", translateText);

// Lắng nghe sự kiện nhấn nút Ask AI
askAIButton.addEventListener("click", askAI);

// Lắng nghe sự kiện nhấn phím Enter trong ô nhập liệu
inputText.addEventListener("keydown", (event) => {
  // Kiểm tra nếu phím là Enter và không phải Shift + Enter
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Ngăn hành vi mặc định (xuống dòng)
    translateText(); // Gọi hàm dịch
  }
});

// Lắng nghe sự kiện nhấn nút "Open Options"
openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage(); // Mở trang options
  window.close(); // Đóng popup sau khi mở trang options
});

// Lắng nghe sự kiện nhấn nút "Options" trong settings section
openOptionsButton2.addEventListener("click", () => {
  chrome.runtime.openOptionsPage(); // Mở trang options
  window.close(); // Đóng popup sau khi mở trang options
});

// Lưu ngôn ngữ đích khi thay đổi
targetLanguageSelect.addEventListener("change", async () => {
  await chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value });
});

// Lắng nghe sự kiện nhấn nút "Clear API Key"
clearApiKeyButton.addEventListener("click", async () => {
  if (confirm("Are you sure you want to clear your API Key? You will need to set it again to use the extension.")) {
    await chrome.storage.local.remove(["geminiApiKey", "geminiApiModel"]);
    // Reload popup để hiển thị lại màn hình set key
    showApiKeyErrorUI();
    resultDiv.textContent = "";
    inputText.value = "";
  }
});

async function askAI() {
  const textToAsk = inputText.value.trim();
  if (!textToAsk) {
    resultDiv.textContent = "Please enter text to ask AI.";
    return;
  }

  const data = await chrome.storage.local.get(["geminiApiKey", "geminiApiModel"]);
  if (!data.geminiApiKey || !data.geminiApiModel) {
    showApiKeyErrorUI();
    return;
  }

  resultDiv.innerHTML = '<span class="loading">Asking AI...</span>';

  // Gửi message đến background script để xử lý
  chrome.runtime.sendMessage(
    { type: "ASK_GEMINI", text: textToAsk },
    (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.innerHTML = `<span class="error">Error: ${chrome.runtime.lastError.message}</span>`;
        return;
      }

      if (response && response.success && response.data) {
        resultDiv.innerHTML = parseMarkdown(response.data);
      } else {
        const errorMsg = response?.error || "Unknown error occurred.";
        resultDiv.innerHTML = `<span class="error">Error: ${errorMsg}</span>`;
      }
    }
  );
}

async function translateText() {
  const textToTranslate = inputText.value.trim();
  if (!textToTranslate) {
    resultDiv.textContent = "Please enter text to translate.";
    return;
  }

  const data = await chrome.storage.local.get(["geminiApiKey", "geminiApiModel"]);
  if (!data.geminiApiKey || !data.geminiApiModel) {
    showApiKeyErrorUI();
    return;
  }

  resultDiv.innerHTML = '<span class="loading">Translating...</span>';

  // Lấy ngôn ngữ đích từ storage hoặc từ select
  const languageData = await chrome.storage.local.get(["targetLanguage"]);
  const targetLanguage = languageData.targetLanguage || targetLanguageSelect.value || "Vietnamese";
  
  // Lưu ngôn ngữ đích nếu chưa có
  if (!languageData.targetLanguage) {
    await chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value });
  }

  // Gửi message đến background script để xử lý
  chrome.runtime.sendMessage(
    { 
      type: "TRANSLATE_GEMINI", 
      text: textToTranslate,
      targetLang: targetLanguage
    },
    (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.innerHTML = `<span class="error">Error: ${chrome.runtime.lastError.message}</span>`;
        return;
      }

      if (response && response.success && response.data) {
        resultDiv.innerHTML = parseMarkdown(response.data);
      } else {
        const errorMsg = response?.error || "Unknown error occurred.";
        resultDiv.innerHTML = `<span class="error">Error: ${errorMsg}</span>`;
      }
    }
  );
}