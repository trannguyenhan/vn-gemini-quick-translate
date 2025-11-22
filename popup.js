const inputText = document.getElementById("inputText");
const translateButton = document.getElementById("translateButton");
const resultDiv = document.getElementById("result");
const apiKeyErrorContainer = document.getElementById("apiKeyErrorContainer");
const openOptionsButton = document.getElementById("openOptionsButton");
const openOptionsButton2 = document.getElementById("openOptionsButton2");
const settingsSection = document.getElementById("settingsSection");
const clearApiKeyButton = document.getElementById("clearApiKeyButton");
const targetLanguageSelect = document.getElementById("targetLanguageSelect");

// Ẩn/hiện các thành phần chính của popup
function showTranslationUI() {
  inputText.style.display = "block";
  targetLanguageSelect.style.display = "block";
  translateButton.style.display = "block";
  resultDiv.style.display = "block";
  apiKeyErrorContainer.style.display = "none";
  settingsSection.style.display = "block";
  inputText.focus(); // Tự động focus vào ô nhập liệu khi hiển thị UI dịch
}

function showApiKeyErrorUI() {
  inputText.style.display = "none";
  targetLanguageSelect.style.display = "none";
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

async function translateText() {
  const textToTranslate = inputText.value.trim();
  if (!textToTranslate) {
    resultDiv.textContent = "Please enter text to translate.";
    return;
  }

  const data = await chrome.storage.local.get(["geminiApiKey", "geminiApiModel"]);
  const GEMINI_API_KEY = data.geminiApiKey;
  const GEMINI_API_MODEL = data.geminiApiModel || "gemini-pro";

  if (!GEMINI_API_KEY || !GEMINI_API_MODEL) {
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

  const prompt = `Translate the following text to ${targetLanguage}. Provide only the translation, no explanations or additional text. Keep it concise and preserve the complete meaning: "${textToTranslate}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const translatedText = data.candidates[0].content.parts[0].text;
      resultDiv.textContent = translatedText;
    } else {
      resultDiv.innerHTML = '<span class="error">Translation failed: Invalid response from Gemini API.</span>';
      console.error("Invalid Gemini API response structure:", data);
    }
  } catch (error) {
    console.error("Error translating text with Gemini:", error);
    resultDiv.innerHTML = `<span class="error">Error: ${error.message}. Please check your API key and network connection.</span>`;
  }
}