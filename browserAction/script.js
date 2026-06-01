const passwordInputField = document.getElementById("passwordInput");
const submitBtn = document.getElementById("submitBtn");
const messageBox = document.getElementById("messageBox");
const visibilityToggle = document.getElementById("visibilityToggle");
const visibilityToggleIcon = document.getElementById("visibilityToggleIcon");
const passwordForm = document.getElementById("passwordForm");

function showMessage(data) {
  submitBtn.innerText = "Paste";
  submitBtn.disabled = false;
  messageBox.classList.remove("success", "error");
  messageBox.classList.add(data.success ? "success" : "error");
  messageBox.replaceChildren();
  const message = document.createElement("p");
  message.textContent = data.message;
  messageBox.appendChild(message);
  setTimeout(() => {
    messageBox.replaceChildren();
    messageBox.classList.remove("success", "error");
  }, 5000);
}

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = passwordInputField.value;
  if (!password) {
    showMessage({ success: false, message: "Enter a password first" });
    return;
  }

  submitBtn.innerText = "Pasting...";
  submitBtn.disabled = true;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.id) {
      throw new Error("No active tab found");
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      command: "pastePassword",
      password,
    });

    if (response && response.success) {
      passwordInputField.value = "";
    }
    showMessage(
      response || { success: false, message: "Password couldn't be pasted" }
    );
  } catch (error) {
    showMessage({ success: false, message: "Password couldn't be pasted" });
    console.log(`Couldn't paste password: ${error.message}`);
  }
});

visibilityToggle.addEventListener("click", () => {
  const passwordHidden = passwordInputField.type === "password";
  const label = passwordHidden ? "Hide password" : "Show password";
  Object.assign(visibilityToggle, {
    title: label,
    ariaLabel: label,
  });
  visibilityToggleIcon.src = passwordHidden
    ? "images/eye-off.svg"
    : "images/eye.svg";
  passwordInputField.type = passwordHidden ? "text" : "password";
});
