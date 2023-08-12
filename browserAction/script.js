document
  .getElementById("copyFromClipboardButton")
  .addEventListener("click", async () => {
    const password = await navigator.clipboard.readText();

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) =>
      browser.tabs.sendMessage(tabs[0].id, {
        command: "showPasteIcon",
        password,
      })
    );
  });
