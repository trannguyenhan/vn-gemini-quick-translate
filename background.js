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