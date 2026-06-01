(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.passwordPasterHasRun) {
    return;
  }
  window.passwordPasterHasRun = true;

  let lastEditableElement = null;

  function isSupportedInput(el) {
    if (el instanceof HTMLTextAreaElement) {
      return true;
    }

    if (!(el instanceof HTMLInputElement)) {
      return false;
    }

    return [
      "email",
      "number",
      "password",
      "search",
      "tel",
      "text",
      "url",
    ].includes(el.type);
  }

  function canBePasted(el) {
    return Boolean(
      el &&
        !el.disabled &&
        !el.readOnly &&
        (isSupportedInput(el) || el.isContentEditable)
    );
  }

  function getPasteTarget() {
    if (canBePasted(document.activeElement)) {
      return document.activeElement;
    }

    if (canBePasted(lastEditableElement)) {
      return lastEditableElement;
    }

    return null;
  }

  function dispatchInputEvent(el, inputType, data) {
    try {
      el.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: false,
          data,
          inputType,
        })
      );
    } catch (_) {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function dispatchChangeEvent(el) {
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setNativeValue(el, value) {
    const prototype =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function setInputSelection(el, start, end) {
    if (typeof el.setSelectionRange === "function") {
      el.setSelectionRange(start, end);
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pasteIntoInput(el, password) {
    el.focus();
    setNativeValue(el, "");
    setInputSelection(el, 0, 0);
    dispatchInputEvent(el, "deleteContentBackward", null);

    for (const char of password) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const nextValue = `${el.value.slice(0, start)}${char}${el.value.slice(
        end
      )}`;
      setNativeValue(el, nextValue);
      setInputSelection(el, start + 1, start + 1);
      dispatchInputEvent(el, "insertText", char);
      await wait(25);
    }

    dispatchChangeEvent(el);
  }

  function clearContentEditable(el) {
    while (el.firstChild) {
      el.firstChild.remove();
    }
    dispatchInputEvent(el, "deleteContentBackward", null);
  }

  function insertContentEditableText(el, text) {
    const selection = window.getSelection();
    const range = document.createRange();
    const textNode = document.createTextNode(text);

    range.selectNodeContents(el);
    range.collapse(false);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function pasteIntoContentEditable(el, password) {
    el.focus();
    clearContentEditable(el);

    for (const char of password) {
      insertContentEditableText(el, char);
      dispatchInputEvent(el, "insertText", char);
      await wait(25);
    }

    dispatchChangeEvent(el);
  }

  async function insertPassword(password) {
    const el = getPasteTarget();

    if (!el) {
      return {
        success: false,
        message: "Select an input field first",
      };
    }

    if (!canBePasted(el)) {
      return {
        success: false,
        message: "Password couldn't be pasted on selected element",
      };
    }

    if (el.isContentEditable) {
      await pasteIntoContentEditable(el, password);
    } else {
      await pasteIntoInput(el, password);
    }

    return {
      success: true,
      message: "Password pasted",
    };
  }

  document.addEventListener(
    "focusin",
    (event) => {
      if (canBePasted(event.target)) {
        lastEditableElement = event.target;
      }
    },
    true
  );

  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "pastePassword") {
      return insertPassword(message.password);
    }

    return undefined;
  });
})();
