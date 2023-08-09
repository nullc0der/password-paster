const passwordInputField = document.getElementById("passwordInput");
const submitBtn = document.getElementById("submitBtn");
const messageBox = document.getElementById("messageBox");
const visibilityToggle = document.getElementById("visibilityToggle");

function showMessage(data) {
  submitBtn.innerText = "paste";
  messageBox.classList.remove("success", "error");
  messageBox.classList.add(data.success ? "success" : "error");
  messageBox.innerHTML = `<p>${data.message}</p>`;
  setTimeout(() => {
    messageBox.innerHTML = "";
    messageBox.classList.remove("success", "error");
  }, 5000);
}

submitBtn.addEventListener("click", () => {
  function sendPassword(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "pastePassword",
      password: passwordInputField.value,
    });
    submitBtn.innerText = "pasting";
  }
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(sendPassword)
    .catch((e) => {
      showMessage({ success: false, message: "Password couldn't be pasted" });
      console.log(`Couldn't paste password: ${e.message}`);
    });
});

visibilityToggle.addEventListener("click", () => {
  visibilityToggle.innerText = "visibility_off";
  if (passwordInputField.type === "password") {
    passwordInputField.type = "text";
  } else {
    passwordInputField.type = "password";
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "showMessage") {
    showMessage(message.data);
  }
});
