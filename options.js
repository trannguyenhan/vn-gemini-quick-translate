const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const geminiModelSelect = document.getElementById("geminiModelSelect");
const customModelContainer = document.getElementById("customModelContainer");
const customModelInput = document.getElementById("customModelInput");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const statusMessageDiv = document.getElementById("statusMessage");

document.addEventListener("DOMContentLoaded", loadSettings);
saveSettingsButton.addEventListener("click", saveSettings);
geminiModelSelect.addEventListener("change", handleModelSelectChange);

async function loadSettings() {
  const data = await chrome.storage.local.get(["geminiApiKey", "geminiApiModel"]);
  if (data.geminiApiKey) {
    geminiApiKeyInput.value = data.geminiApiKey;
  }
  if (data.geminiApiModel) {
    // Kiểm tra xem model đã lưu có trong danh sách select không
    const optionExists = Array.from(geminiModelSelect.options).some(
      option => option.value === data.geminiApiModel
    );
    
    if (optionExists) {
      geminiModelSelect.value = data.geminiApiModel;
    } else {
      // Nếu model không có trong danh sách, hiển thị custom input
      geminiModelSelect.value = "custom";
      customModelInput.value = data.geminiApiModel;
      // Delay để đảm bảo DOM đã render
      setTimeout(() => {
        customModelContainer.classList.add("show");
      }, 100);
    }
  } else {
    // Đặt giá trị mặc định nếu chưa có model nào được lưu
    geminiModelSelect.value = geminiModelSelect.options[0].value;
  }

  if (data.geminiApiKey || data.geminiApiModel) {
    displayStatus("Settings loaded.", "info");
  } else {
    displayStatus("No settings found. Please enter your API Key and select a model.", "info");
  }
}

function handleModelSelectChange() {
  if (geminiModelSelect.value === "custom") {
    customModelContainer.classList.add("show");
    // Focus vào input sau khi animation
    setTimeout(() => {
      customModelInput.focus();
    }, 200);
  } else {
    customModelContainer.classList.remove("show");
    customModelInput.value = "";
  }
}

async function saveSettings() {
  const key = geminiApiKeyInput.value.trim();
  let model = geminiModelSelect.value;

  // Nếu chọn custom, lấy giá trị từ input custom
  if (model === "custom") {
    model = customModelInput.value.trim();
    if (!model) {
      displayStatus("Please enter a custom model name.", "error");
      return;
    }
  }

  if (key) {
    await chrome.storage.local.set({
      geminiApiKey: key,
      geminiApiModel: model
    });
    displayStatus("Settings saved successfully!", "success");
  } else {
    displayStatus("Please enter an API Key to save settings.", "error");
  }
}

function displayStatus(message, type) {
  // Reset animation bằng cách remove và add lại class
  statusMessageDiv.style.animation = 'none';
  setTimeout(() => {
    statusMessageDiv.style.animation = '';
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status ${type}`;
  }, 10);
}