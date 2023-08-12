let password = "";
const notificationBar = document.createElement("div");

function insertPassword(inputElement, pasteButton) {
  const passwordChunks = password.split("");
  const pasteInterval = 200; // ms

  if (passwordChunks.length) {
    showNotificationBar("Password pasting...", false);
    for (let i = 0; i < passwordChunks.length; i++) {
      setTimeout(() => {
        inputElement.value += passwordChunks[i];
        inputElement.dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true })
        );
        if (passwordChunks.length === i + 1) {
          pasteButton.remove();
          showNotificationBar("Password pasted", false);
        }
      }, i * pasteInterval);
    }
  } else {
    showNotificationBar("No password copied from clipboard", true);
  }
}

function removePasteButton() {
  const pasteButtons = document.querySelectorAll(".password-paster-icon");
  pasteButtons.forEach((el) => el.remove());
}

function populatePasteButton() {
  removePasteButton();
  const passwordInputs = document.querySelectorAll("input[type=password]");

  for (const passwordInput of passwordInputs) {
    if (passwordInput.style.display !== "none") {
      const passwordInputRect = passwordInput.getBoundingClientRect();
      const passwordPasterIcon = document.createElement("img");

      Object.assign(passwordPasterIcon, {
        src: browser.runtime.getURL("icons/icon_32.png"),
        className: "password-paster-icon",
      });
      Object.assign(passwordPasterIcon.style, {
        top: `${passwordInputRect.top + (passwordInputRect.height / 2 - 8)}px`, //1/2 of Element height - 1/2 of pasterIcon height
        left: `${passwordInputRect.right - 21}px`, //Icon width + 5px
      });
      passwordInput.parentElement.appendChild(passwordPasterIcon);
      passwordPasterIcon.addEventListener("click", (e) => {
        e.preventDefault();
        insertPassword(passwordInput, e.target);
      });
    }
  }
}

function addNotificationBar() {
  notificationBar.id = "notificationBar";
  Object.assign(notificationBar.style, {
    visibility: "hidden",
    opacity: 0,
  });

  document.body.appendChild(notificationBar);
}

function showNotificationBar(content, hasError) {
  notificationBar.innerHTML = `<p>${content}</p>`;
  notificationBar.className = hasError ? "error" : "success";
  Object.assign(notificationBar.style, {
    visibility: "visible",
    opacity: 1,
  });
  setTimeout(hideNotificationBar, 2000);
}

function hideNotificationBar() {
  Object.assign(notificationBar.style, {
    visibility: "hidden",
    opacity: 0,
  });
  setTimeout(() => {
    notificationBar.innerHTML = "";
    notificationBar.removeAttribute("class");
  }, 1000);
}

addNotificationBar();

browser.runtime.onMessage.addListener((message) => {
  if (message.command === "showPasteIcon") {
    password = message.password;
    populatePasteButton();
  }
});
