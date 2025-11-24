// Hàm gọi Gemini API
async function callGeminiAPI(text, taskType, model, targetLang = 'Vietnamese', apiKey) {
    if (!apiKey) {
        return { success: false, error: "API Key chưa được cấu hình. Vui lòng vào cài đặt tiện ích để thêm API Key.", actionType: taskType };
    }
    if (!model) {
        model = 'gemini-2.5-flash';
    }

    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let promptText;
    if (taskType === "ASK_GEMINI") {
        promptText = `Hãy cho tôi biết về "${text}". Trả lời ngắn gọn và chính xác.`;
    } else if (taskType === "TRANSLATE_GEMINI") {
        promptText = `Translate the following text to ${targetLang}. Provide only the translation, no explanations or additional text. Keep it concise and preserve the complete meaning: "${text}"`;
    } else {
        return { success: false, error: "Loại tác vụ không hợp lệ.", actionType: taskType };
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    // temperature: 0.7,
                    // maxOutputTokens: 1000,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error Response:", errorData);
            let errorMessage = `Lỗi API: ${response.statusText}`;
            if (errorData.error && errorData.error.message) {
                errorMessage = `Lỗi API: ${errorData.error.message}`;
            }
            return { success: false, error: errorMessage, actionType: taskType };
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
            return { success: true, data: data.candidates[0].content.parts[0].text, actionType: taskType };
        } else {
            // Kiểm tra phản hồi chặn từ API
            if (data.promptFeedback && data.promptFeedback.blockReason) {
                 return { success: false, error: `Yêu cầu bị chặn bởi API: ${data.promptFeedback.blockReason}`, actionType: taskType };
            }
            if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === "SAFETY") {
                return { success: false, error: "Yêu cầu bị chặn vì lý do an toàn nội dung.", actionType: taskType };
            }
            console.warn("Gemini API - No content in response:", data);
            return { success: false, error: "Không có nội dung trả về từ AI hoặc định dạng phản hồi không đúng.", actionType: taskType };
        }

    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        return { success: false, error: `Lỗi kết nối hoặc xử lý: ${error.message}`, actionType: taskType };
    }
}

// Lắng nghe tin nhắn từ content.js hoặc popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ASK_GEMINI" || request.type === "TRANSLATE_GEMINI") {
        chrome.storage.local.get(['geminiApiKey', 'geminiApiModel'], async (result) => {
            const { geminiApiKey, geminiApiModel } = result;
            const response = await callGeminiAPI(request.text, request.type, geminiApiModel, request.targetLang, geminiApiKey);
            sendResponse(response);
        });
        return true; // Will respond asynchronously.
    } else if (request.type === "selectedText") {
        // Giữ lại logic cũ cho keyboard shortcut
        return false;
    }
    return false;
});

// Context Menu (Menu chuột phải)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "askGeminiContextMenu",
        title: "Hỏi Gemini về '%s'",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "translateGeminiContextMenu",
        title: "Dịch '%s' với Gemini",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab || !tab.id) {
        console.error("Context menu clicked without a valid tab.");
        return;
    }
    if (!info.selectionText) return;

    const { geminiApiKey, geminiApiModel } = await chrome.storage.local.get(['geminiApiKey', 'geminiApiModel']);
    const { targetLanguage } = await chrome.storage.local.get(['targetLanguage']);
    const targetLang = targetLanguage || "Vietnamese";
    
    let taskType = "";
    let title = "";

    if (info.menuItemId === "askGeminiContextMenu") {
        taskType = "ASK_GEMINI";
        title = "Kết quả từ AI Gemini (Menu):";
    } else if (info.menuItemId === "translateGeminiContextMenu") {
        taskType = "TRANSLATE_GEMINI";
        title = "Bản dịch (Menu):";
    } else {
        return;
    }

    // Gửi tin nhắn yêu cầu hiển thị loading tới content script
    try {
        await chrome.tabs.sendMessage(tab.id, {
            type: "SHOW_GEMINI_RESULT_FROM_CONTEXT_MENU",
            title: `Đang xử lý "${info.menuItemId === "askGeminiContextMenu" ? "Hỏi AI" : "Dịch"}"...`,
            success: true,
            data: "<div class='gqt-spinner'></div>",
            error: null,
            actionType: taskType,
            isLoading: true
        });
    } catch (e) {
        console.warn("Could not send loading message to content script:", e);
    }

    const response = await callGeminiAPI(info.selectionText, taskType, geminiApiModel, targetLang, geminiApiKey);

    // Gửi kết quả cuối cùng tới content script
    try {
        await chrome.tabs.sendMessage(tab.id, {
            type: "SHOW_GEMINI_RESULT_FROM_CONTEXT_MENU",
            title: title,
            success: response.success,
            data: response.data,
            error: response.error,
            actionType: taskType,
            isLoading: false
        });
    } catch (e) {
        console.error("Error sending final result to content script:", e);
    }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "_execute_action") {
      // Lấy văn bản được chọn từ tab hiện tại
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          try {
            const tabId = tabs[0].id;
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tabId },
              function: getSelectionText,
            });
  
            const selectedText = result.result;
  
            // Mở popup và gửi văn bản được chọn
            chrome.action.openPopup();
            chrome.runtime.sendMessage({ type: "selectedText", text: selectedText });
          } catch (error) {
            console.error("Error getting selected text or opening popup:", error);
          }
        }
      });
    }
  });
  
  // Hàm này sẽ được chèn vào trang để lấy văn bản được chọn
  function getSelectionText() {
    return window.getSelection().toString();
  }