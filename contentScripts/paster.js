(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  function canBePasted(el) {
    if (
      el.type === "textarea" ||
      el.type === "text" ||
      el.type === "password"
    ) {
      return true;
    }
    if (el.isContentEditable) {
      return true;
    }
    return false;
  }

  function insertPassword(password) {
    const el = document.activeElement;

    if (!el) {
      browser.runtime.sendMessage({
        type: "showMessage",
        data: {
          success: false,
          message: "Select an input field first",
        },
      });
    } else {
      const passwordChunks = password.split("");
      const pasteInterval = 300; // ms
      if (canBePasted(el)) {
        for (let i = 0; i < passwordChunks.length; i++) {
          setTimeout(() => {
            el.value += passwordChunks[i];
            el.dispatchEvent(
              new Event("input", { bubbles: true, cancelable: true })
            );
            if (passwordChunks.length === i + 1) {
              browser.runtime.sendMessage({
                type: "showMessage",
                data: {
                  success: true,
                  message: "Password pasted",
                },
              });
            }
          }, i * pasteInterval);
        }
      } else {
        browser.runtime.sendMessage({
          type: "showMessage",
          data: {
            success: false,
            message: "Password couldn't be pasted on selected element",
          },
        });
      }
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "pastePassword") {
      insertPassword(message.password);
    }
  });
})();
