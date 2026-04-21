(function () {
  "use strict";

  const DateTime = window.luxon ? window.luxon.DateTime : null;
  const TIME_ZONES = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [
        "UTC",
        "America/Los_Angeles",
        "America/New_York",
        "Europe/London",
        "Europe/Paris",
        "Asia/Kolkata",
        "Asia/Tokyo",
        "Australia/Sydney"
      ];
  const CURRENCY_RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150,
    INR: 83
  };
  const MORSE_MAP = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    0: "-----",
    1: ".----",
    2: "..---",
    3: "...--",
    4: "....-",
    5: ".....",
    6: "-....",
    7: "--...",
    8: "---..",
    9: "----."
  };
  const MORSE_REVERSE = Object.fromEntries(
    Object.entries(MORSE_MAP).map(function (entry) {
      return [entry[1], entry[0]];
    })
  );
  const EMOJI_MAP = {
    ":)": "\u{1F60A}",
    ":(": "\u{1F622}",
    "<3": "\u{2764}\u{FE0F}",
    ":D": "\u{1F603}",
    ";-)": "\u{1F609}",
    ":P": "\u{1F61B}",
    ":O": "\u{1F62E}",
    ":*": "\u{1F618}",
    ":s": "\u{1F615}",
    ":fire:": "\u{1F525}",
    ":rocket:": "\u{1F680}"
  };
  const EMOJI_REVERSE = Object.fromEntries(
    Object.entries(EMOJI_MAP).map(function (entry) {
      return [entry[1], entry[0]];
    })
  );
  const categories = {
    text: {
      label: "Text and code",
      description: "Formatting, parsing, preview, and transformation tools for text-heavy work."
    },
    calc: {
      label: "Calculators",
      description: "Quick calculations with clearer summaries, breakdowns, and validation."
    },
    image: {
      label: "Image and media",
      description: "Image transforms plus QR and barcode utilities with preview-first output."
    },
    utility: {
      label: "Utilities",
      description: "Hashing, encoding, IDs, timers, and reference helpers for everyday operations."
    }
  };
  const featuredIds = [
    "jsonformatter",
    "markdown",
    "scientificcalc",
    "qrcode",
    "imageresize",
    "hashgenerator"
  ];

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function makeField(labelText, control) {
    const field = document.createElement("label");
    field.className = "field-label";
    const label = document.createElement("span");
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(control);
    return field;
  }

  function createInput(type, placeholder, value) {
    const input = document.createElement("input");
    input.className = "text-input";
    input.type = type || "text";
    if (placeholder) {
      input.placeholder = placeholder;
    }
    if (value !== undefined) {
      input.value = value;
    }
    return input;
  }

  function createTextarea(placeholder, rows) {
    const textarea = document.createElement("textarea");
    textarea.className = "textarea-input";
    if (placeholder) {
      textarea.placeholder = placeholder;
    }
    if (rows) {
      textarea.rows = rows;
    }
    return textarea;
  }

  function createSelect(options, selectedValue) {
    const select = document.createElement("select");
    select.className = "select-input";
    options.forEach(function (option) {
      const element = document.createElement("option");
      if (typeof option === "string") {
        element.value = option;
        element.textContent = option;
      } else {
        element.value = option.value;
        element.textContent = option.label;
      }
      if (String(element.value) === String(selectedValue)) {
        element.selected = true;
      }
      select.appendChild(element);
    });
    return select;
  }

  function buildMetricGrid(items) {
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    items.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "metric-card";

      const label = document.createElement("span");
      label.className = "metric-card__label";
      label.textContent = item.label;
      card.appendChild(label);

      const value = document.createElement("strong");
      value.className = "metric-card__value";
      value.textContent = item.value;
      card.appendChild(value);

      if (item.caption) {
        const caption = document.createElement("p");
        caption.className = "metric-card__caption";
        caption.textContent = item.caption;
        card.appendChild(caption);
      }

      grid.appendChild(card);
    });
    return grid;
  }

  function createResultHero(value, caption) {
    const card = document.createElement("div");
    card.className = "result-hero";

    const valueNode = document.createElement("div");
    valueNode.className = "result-hero__value";
    valueNode.textContent = value;
    card.appendChild(valueNode);

    const captionNode = document.createElement("p");
    captionNode.className = "result-hero__caption";
    captionNode.textContent = caption;
    card.appendChild(captionNode);

    return card;
  }

  function createMonoBlock(text) {
    const block = document.createElement("pre");
    block.className = "mono-block";
    block.textContent = text;
    return block;
  }

  function createRichPreview(html) {
    const block = document.createElement("div");
    block.className = "rich-preview";
    block.innerHTML = html;
    return block;
  }

  function createTable(headers, rows) {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach(function (header) {
      const cell = document.createElement("th");
      cell.textContent = header;
      headerRow.appendChild(cell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      row.forEach(function (value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    return wrap;
  }

  function createPreviewStage(emptyMessage) {
    const root = document.createElement("div");
    root.className = "preview-stage";

    const frame = document.createElement("div");
    frame.className = "preview-stage__frame";
    root.appendChild(frame);

    const meta = document.createElement("div");
    root.appendChild(meta);

    function setMessage(message) {
      clearNode(frame);
      const text = document.createElement("p");
      text.className = "supporting-copy";
      text.textContent = message;
      frame.appendChild(text);
    }

    function setNode(node) {
      clearNode(frame);
      frame.appendChild(node);
    }

    function setMetrics(items) {
      clearNode(meta);
      if (items && items.length) {
        meta.appendChild(buildMetricGrid(items));
      }
    }

    setMessage(emptyMessage || "Nothing to preview yet.");

    return {
      root: root,
      frame: frame,
      meta: meta,
      setMessage: setMessage,
      setNode: setNode,
      setMetrics: setMetrics
    };
  }

  function safeTextToBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function safeBase64ToText(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  function decodeBase64Url(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    return safeBase64ToText(normalized);
  }

  function toTitleCase(value) {
    return value.replace(/\w\S*/g, function (token) {
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    });
  }

  function toSentenceCase(value) {
    if (!value.trim()) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  function getWordCount(value) {
    return value.trim() ? value.trim().split(/\s+/).length : 0;
  }

  function createPassword(length, settings) {
    let source = "";
    if (settings.uppercase) {
      source += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (settings.lowercase) {
      source += "abcdefghijklmnopqrstuvwxyz";
    }
    if (settings.numbers) {
      source += "0123456789";
    }
    if (settings.symbols) {
      source += "!@#$%^&*()-_=+[]{}";
    }
    if (!source) {
      return "";
    }

    let output = "";
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let index = 0; index < length; index += 1) {
      output += source[values[index] % source.length];
    }
    return output;
  }

  function evaluatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) {
      score += 1;
    }
    if (password.length >= 14) {
      score += 1;
    }
    if (/[A-Z]/.test(password)) {
      score += 1;
    }
    if (/[a-z]/.test(password)) {
      score += 1;
    }
    if (/[0-9]/.test(password)) {
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    const label = score <= 2 ? "Weak" : score <= 4 ? "Fair" : score === 5 ? "Good" : "Strong";
    const tips = [];
    if (password.length < 12) {
      tips.push("Use at least 12 characters.");
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      tips.push("Mix uppercase and lowercase letters.");
    }
    if (!/[0-9]/.test(password)) {
      tips.push("Add numbers.");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      tips.push("Add symbols for more variety.");
    }
    return {
      score: score,
      label: label,
      tips: tips
    };
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes)) {
      return "0 B";
    }
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1) + " " + units[unitIndex];
  }

  function parseCsv(text) {
    const rows = [];
    let value = "";
    let row = [];
    let inQuotes = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"') {
        if (inQuotes && text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (character === "," && !inQuotes) {
        row.push(value);
        value = "";
      } else if ((character === "\n" || character === "\r") && !inQuotes) {
        if (character === "\r" && text[index + 1] === "\n") {
          index += 1;
        }
        row.push(value);
        if (row.some(function (cell) { return cell.length; })) {
          rows.push(row);
        }
        row = [];
        value = "";
      } else {
        value += character;
      }
    }
    row.push(value);
    if (row.some(function (cell) { return cell.length; })) {
      rows.push(row);
    }
    return rows;
  }

  function stringifyCsv(records) {
    return records
      .map(function (row) {
        return row
          .map(function (cell) {
            const normalized = cell == null ? "" : String(cell);
            if (/[,"\n]/.test(normalized)) {
              return '"' + normalized.replace(/"/g, '""') + '"';
            }
            return normalized;
          })
          .join(",");
      })
      .join("\n");
  }

  function createImageInfo(file, dataUrl) {
    return loadImageElement(dataUrl).then(function (image) {
      return {
        name: file.name,
        size: file.size,
        type: file.type || "image/png",
        width: image.naturalWidth,
        height: image.naturalHeight,
        dataUrl: dataUrl
      };
    });
  }

  function loadImageElement(source) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("Unable to load image."));
      };
      image.src = source;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error("Unable to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function loadImageFile(file) {
    return readFileAsDataUrl(file).then(function (dataUrl) {
      return createImageInfo(file, dataUrl);
    });
  }

  function updateResultBody(body, nodes) {
    clearNode(body);
    const list = Array.isArray(nodes) ? nodes : [nodes];
    list.filter(Boolean).forEach(function (node) {
      body.appendChild(node);
    });
  }

  function createBooleanLabel(text, checked) {
    const label = document.createElement("label");
    label.className = "badge";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    label.appendChild(input);
    const copy = document.createElement("span");
    copy.textContent = text;
    label.appendChild(copy);
    return {
      root: label,
      input: input
    };
  }

  function buildImageWorkbench(ctx, tool, introText) {
    const shell = ctx.renderToolShell({
      title: tool.name,
      intro: introText || tool.description,
      resultTitle: "Preview stage",
      resultDetail: "Upload an image to start generating output."
    });

    const fileInput = createInput("file");
    fileInput.accept = "image/*";
    shell.controls.appendChild(makeField("Source image", fileInput));

    const preview = createPreviewStage("Upload an image to preview it here.");
    shell.resultBody.appendChild(preview.root);
    ctx.setEmptyState(shell.resultPanel, "Waiting for a source image", "Upload an image to unlock editing and export actions.");

    let original = null;
    let current = null;

    function applyImageInfo(info) {
      current = info;
      loadImageElement(info.dataUrl).then(function (image) {
        preview.setNode(image);
        preview.setMetrics([
          { label: "Dimensions", value: info.width + " x " + info.height, caption: "pixels" },
          { label: "File type", value: info.type.replace("image/", "").toUpperCase(), caption: info.name || "generated" },
          { label: "Approx size", value: formatFileSize(info.size || Math.round(info.dataUrl.length * 0.75)), caption: "in browser memory" }
        ]);
      });
    }

    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      loadImageFile(file)
        .then(function (info) {
          original = info;
          applyImageInfo(info);
          ctx.setSuccessState(shell.resultPanel, "Source image ready", "Adjust controls or export the current preview.");
        })
        .catch(function (error) {
          ctx.setErrorState(shell.resultPanel, "Image load failed", error.message);
        });
    });

    return {
      shell: shell,
      fileInput: fileInput,
      preview: preview,
      getCurrent: function () {
        return current;
      },
      getOriginal: function () {
        return original;
      },
      setCurrentFromUrl: function (dataUrl, nameHint) {
        return loadImageElement(dataUrl).then(function (image) {
          const info = {
            name: nameHint || (current ? current.name : "image.png"),
            size: Math.round(dataUrl.length * 0.75),
            type: "image/png",
            width: image.naturalWidth,
            height: image.naturalHeight,
            dataUrl: dataUrl
          };
          applyImageInfo(info);
          return info;
        });
      },
      resetToOriginal: function () {
        if (original) {
          applyImageInfo(original);
        }
      }
    };
  }

  function renderWordCounter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Word Counter",
      intro: "Count words, characters, lines, and reading time while you type.",
      resultTitle: "Live counts"
    });
    const textarea = createTextarea("Paste or type your text here.", 12);
    shell.controls.appendChild(makeField("Text input", textarea));

    function update() {
      const value = textarea.value;
      if (!value.trim()) {
        updateResultBody(shell.resultBody, createResultHero("0 words", "Add text to start counting."));
        ctx.setEmptyState(shell.resultPanel, "No text yet", "Start typing or paste content to populate the counters.");
        return;
      }
      updateResultBody(shell.resultBody, buildMetricGrid([
        { label: "Words", value: String(getWordCount(value)), caption: "split on whitespace" },
        { label: "Characters", value: String(value.length), caption: "including spaces" },
        { label: "Lines", value: String(value.split(/\r?\n/).length), caption: "visible rows" },
        {
          label: "Read time",
          value: Math.max(1, Math.ceil(getWordCount(value) / 200)) + " min",
          caption: "estimated at 200 wpm"
        }
      ]));
      ctx.setSuccessState(shell.resultPanel, "Counts ready", "Live metrics update as you edit the text.");
    }

    textarea.addEventListener("input", update);
    update();

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return textarea.value;
      },
      label: "Copy text"
    });
    const clearButton = ctx.createActionButton({
      label: "Clear text",
      icon: "ink_eraser",
      variant: "surface",
      onClick: function () {
        textarea.value = "";
        update();
      }
    });
    shell.actions.appendChild(clearButton);
  }

  function renderCharCounter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Character Counter",
      intro: "Track total characters, whitespace-free characters, words, and line count.",
      resultTitle: "Character metrics"
    });
    const textarea = createTextarea("Start typing to inspect the character profile.", 12);
    shell.controls.appendChild(makeField("Text input", textarea));

    function update() {
      const value = textarea.value;
      if (!value.trim()) {
        updateResultBody(shell.resultBody, createResultHero("0 chars", "No content entered yet."));
        ctx.setEmptyState(shell.resultPanel, "Awaiting text", "Paste or type content to see character metrics.");
        return;
      }
      updateResultBody(shell.resultBody, buildMetricGrid([
        { label: "Characters", value: String(value.length), caption: "all characters" },
        { label: "No spaces", value: String(value.replace(/\s/g, "").length), caption: "whitespace removed" },
        { label: "Words", value: String(getWordCount(value)), caption: "quick token count" },
        { label: "Lines", value: String(value.split(/\r?\n/).length), caption: "newline separated" }
      ]));
      ctx.setSuccessState(shell.resultPanel, "Character metrics ready", "Counts update in real time.");
    }

    textarea.addEventListener("input", update);
    update();

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return textarea.value;
      },
      label: "Copy text"
    });
  }

  function renderCaseConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Case Converter",
      intro: "Transform a block of text between uppercase, lowercase, title case, and sentence case.",
      resultTitle: "Converted output"
    });
    const textarea = createTextarea("Paste text you want to transform.", 10);
    shell.controls.appendChild(makeField("Input text", textarea));

    let output = "";

    function renderOutput(stateTitle, stateDetail) {
      if (!output) {
        updateResultBody(shell.resultBody, createResultHero("No output yet", "Choose a transform to generate text."));
        ctx.setEmptyState(shell.resultPanel, "Select a conversion", "Use one of the transform buttons to generate a new text block.");
        return;
      }
      updateResultBody(shell.resultBody, createMonoBlock(output));
      ctx.setSuccessState(shell.resultPanel, stateTitle, stateDetail);
    }

    const buttons = document.createElement("div");
    buttons.className = "action-row";
    [
      {
        label: "UPPERCASE",
        transform: function (value) { return value.toUpperCase(); },
        detail: "All letters converted to uppercase."
      },
      {
        label: "lowercase",
        transform: function (value) { return value.toLowerCase(); },
        detail: "All letters converted to lowercase."
      },
      {
        label: "Title Case",
        transform: toTitleCase,
        detail: "Each token converted to title case."
      },
      {
        label: "Sentence case",
        transform: toSentenceCase,
        detail: "The first character is capitalized."
      }
    ].forEach(function (config) {
      const button = ctx.createActionButton({
        label: config.label,
        icon: "text_fields",
        variant: "surface",
        onClick: function () {
          if (!textarea.value.trim()) {
            output = "";
            renderOutput("No input provided", "Add text before applying a transformation.");
            return;
          }
          output = config.transform(textarea.value);
          renderOutput("Converted output ready", config.detail);
        }
      });
      buttons.appendChild(button);
    });
    shell.controls.appendChild(buttons);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    shell.actions.appendChild(ctx.createActionButton({
      label: "Clear",
      icon: "ink_eraser",
      variant: "surface",
      onClick: function () {
        textarea.value = "";
        output = "";
        renderOutput();
      }
    }));

    renderOutput();
  }

  function renderTextReverser(ctx) {
    const shell = ctx.renderToolShell({
      title: "Text Reverser",
      intro: "Reverse a string while preserving every character in its current order.",
      resultTitle: "Reversed text"
    });
    const textarea = createTextarea("Paste or type the text you want to reverse.", 10);
    shell.controls.appendChild(makeField("Input text", textarea));
    let output = "";

    const reverseButton = ctx.createActionButton({
      label: "Reverse text",
      icon: "swap_horiz",
      variant: "tonal",
      onClick: function () {
        if (!textarea.value) {
          output = "";
          ctx.setEmptyState(shell.resultPanel, "No text entered", "Add text before reversing it.");
          updateResultBody(shell.resultBody, createResultHero("Nothing to reverse", "The reversed output will appear here."));
          return;
        }
        output = textarea.value.split("").reverse().join("");
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Reversed output ready", "The transformed string preserves every character.");
      }
    });
    shell.controls.appendChild(reverseButton);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "The reversed text will appear here."));
    ctx.setEmptyState(shell.resultPanel, "Awaiting text", "Enter text and run the reverse action.");
  }

  function renderPasswordGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Password Generator",
      intro: "Create a stronger password with adjustable length and character sets.",
      resultTitle: "Generated password"
    });
    const lengthInput = createInput("number", "", 16);
    lengthInput.min = "6";
    lengthInput.max = "64";
    const uppercaseToggle = createBooleanLabel("Uppercase", true);
    const lowercaseToggle = createBooleanLabel("Lowercase", true);
    const numberToggle = createBooleanLabel("Numbers", true);
    const symbolToggle = createBooleanLabel("Symbols", true);
    shell.controls.appendChild(makeField("Length", lengthInput));

    const toggleRow = document.createElement("div");
    toggleRow.className = "toggle-row";
    [uppercaseToggle, lowercaseToggle, numberToggle, symbolToggle].forEach(function (toggle) {
      toggleRow.appendChild(toggle.root);
    });
    shell.controls.appendChild(toggleRow);

    let generated = "";

    function renderPasswordOutput() {
      if (!generated) {
        updateResultBody(shell.resultBody, createResultHero("No password yet", "Choose settings and generate a password."));
        ctx.setEmptyState(shell.resultPanel, "Generator idle", "Pick a length and character mix, then generate a password.");
        return;
      }
      const report = evaluatePasswordStrength(generated);
      updateResultBody(shell.resultBody, [
        createMonoBlock(generated),
        buildMetricGrid([
          { label: "Strength", value: report.label, caption: "heuristic estimate" },
          { label: "Length", value: String(generated.length), caption: "characters" },
          { label: "Character sets", value: String([
            uppercaseToggle.input.checked,
            lowercaseToggle.input.checked,
            numberToggle.input.checked,
            symbolToggle.input.checked
          ].filter(Boolean).length), caption: "enabled groups" }
        ])
      ]);
      ctx.setSuccessState(shell.resultPanel, "Password ready", "Copy it into a secure password manager when you are done.");
    }

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate password",
      icon: "key",
      variant: "tonal",
      onClick: function () {
        const length = Number(lengthInput.value);
        if (!Number.isFinite(length) || length < 6 || length > 64) {
          generated = "";
          ctx.setErrorState(shell.resultPanel, "Invalid length", "Use a value between 6 and 64 characters.");
          updateResultBody(shell.resultBody, createResultHero("Length error", "Adjust the length and try again."));
          return;
        }
        generated = createPassword(length, {
          uppercase: uppercaseToggle.input.checked,
          lowercase: lowercaseToggle.input.checked,
          numbers: numberToggle.input.checked,
          symbols: symbolToggle.input.checked
        });
        if (!generated) {
          ctx.setErrorState(shell.resultPanel, "No character groups selected", "Enable at least one character set before generating.");
          updateResultBody(shell.resultBody, createResultHero("Nothing generated", "Turn on at least one character group."));
          return;
        }
        renderPasswordOutput();
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return generated;
      }
    });
    renderPasswordOutput();
  }

  function renderLoremGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Lorem Ipsum Generator",
      intro: "Generate placeholder paragraphs for layout testing and design mocks.",
      resultTitle: "Generated placeholder text"
    });
    const countSelect = createSelect([
      { value: "1", label: "1 paragraph" },
      { value: "2", label: "2 paragraphs" },
      { value: "3", label: "3 paragraphs" },
      { value: "4", label: "4 paragraphs" },
      { value: "5", label: "5 paragraphs" }
    ], "2");
    shell.controls.appendChild(makeField("Paragraph count", countSelect));

    let output = "";
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate placeholder",
      icon: "description",
      variant: "tonal",
      onClick: function () {
        output = Array(Number(countSelect.value)).fill(lorem).join("\n\n");
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Placeholder ready", "Use the generated copy for quick visual fill.");
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No placeholder text yet", "Choose how many paragraphs to generate."));
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Run the generator to create placeholder paragraphs.");
  }

  function renderMarkdownPreview(ctx) {
    const shell = ctx.renderToolShell({
      title: "Markdown Preview",
      intro: "Write Markdown on the left and inspect a rendered preview on the right.",
      resultTitle: "Rendered preview"
    });
    const textarea = createTextarea("# Heading\n\nWrite **Markdown** here.", 14);
    shell.controls.appendChild(makeField("Markdown source", textarea));
    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return textarea.value;
      },
      label: "Copy markdown"
    });

    function update() {
      if (!textarea.value.trim()) {
        updateResultBody(shell.resultBody, createResultHero("Preview empty", "Markdown output will render here."));
        ctx.setEmptyState(shell.resultPanel, "No Markdown yet", "Type Markdown into the editor to render a preview.");
        return;
      }
      if (!window.marked || typeof window.marked.parse !== "function") {
        updateResultBody(shell.resultBody, createResultHero("Preview unavailable", "The Markdown renderer failed to load."));
        ctx.setErrorState(shell.resultPanel, "Renderer unavailable", "The Markdown library is not available in this session.");
        return;
      }
      updateResultBody(shell.resultBody, createRichPreview(window.marked.parse(textarea.value)));
      ctx.setSuccessState(shell.resultPanel, "Preview updated", "The rendered output reflects the current Markdown source.");
    }

    textarea.addEventListener("input", update);
    update();
  }

  function renderJsonFormatter(ctx) {
    const shell = ctx.renderToolShell({
      title: "JSON Formatter",
      intro: "Prettify or minify JSON with clear validation feedback.",
      resultTitle: "Formatted JSON"
    });
    const textarea = createTextarea('{"project":"Tools Super App","version":3}', 14);
    shell.controls.appendChild(makeField("JSON input", textarea));
    let output = "";

    const buttonRow = document.createElement("div");
    buttonRow.className = "action-row";
    [
      {
        label: "Prettify",
        formatter: function (value) {
          return JSON.stringify(JSON.parse(value), null, 2);
        }
      },
      {
        label: "Minify",
        formatter: function (value) {
          return JSON.stringify(JSON.parse(value));
        }
      }
    ].forEach(function (config) {
      buttonRow.appendChild(ctx.createActionButton({
        label: config.label,
        icon: "data_object",
        variant: config.label === "Prettify" ? "tonal" : "surface",
        onClick: function () {
          if (!textarea.value.trim()) {
            output = "";
            ctx.setEmptyState(shell.resultPanel, "No JSON entered", "Paste JSON before formatting it.");
            updateResultBody(shell.resultBody, createResultHero("No output yet", "Formatted JSON will appear here."));
            return;
          }
          try {
            output = config.formatter(textarea.value);
            updateResultBody(shell.resultBody, createMonoBlock(output));
            ctx.setSuccessState(shell.resultPanel, "JSON formatted", "Validation passed and the formatted output is ready.");
          } catch (error) {
            output = "";
            updateResultBody(shell.resultBody, createResultHero("Invalid JSON", "Fix the JSON structure and try again."));
            ctx.setErrorState(shell.resultPanel, "Invalid JSON", error.message);
          }
        }
      }));
    });
    shell.controls.appendChild(buttonRow);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No JSON formatted yet", "Run Prettify or Minify to create output."));
    ctx.setEmptyState(shell.resultPanel, "Formatter idle", "Paste JSON and choose an action.");
  }

  function renderRegexTester(ctx) {
    const shell = ctx.renderToolShell({
      title: "Regex Tester",
      intro: "Test a regular expression against sample text and inspect the match list.",
      resultTitle: "Regex matches"
    });
    const patternInput = createInput("text", "\\d+");
    const flagsInput = createInput("text", "g");
    const textInput = createTextarea("Paste the test text here.", 10);
    const fields = document.createElement("div");
    fields.className = "split-fields";
    fields.appendChild(makeField("Pattern", patternInput));
    fields.appendChild(makeField("Flags", flagsInput));
    shell.controls.appendChild(fields);
    shell.controls.appendChild(makeField("Test text", textInput));

    shell.controls.appendChild(ctx.createActionButton({
      label: "Run test",
      icon: "code",
      variant: "tonal",
      onClick: function () {
        if (!patternInput.value.trim() || !textInput.value.trim()) {
          updateResultBody(shell.resultBody, createResultHero("No matches yet", "Enter both a pattern and test text."));
          ctx.setEmptyState(shell.resultPanel, "Missing input", "Add both a pattern and test text before running the regex.");
          return;
        }
        try {
          const flags = flagsInput.value.includes("g") ? flagsInput.value : flagsInput.value + "g";
          const expression = new RegExp(patternInput.value, flags);
          const matches = Array.from(textInput.value.matchAll(expression));
          if (!matches.length) {
            updateResultBody(shell.resultBody, createResultHero("0 matches", "The pattern ran successfully but found nothing."));
            ctx.setSuccessState(shell.resultPanel, "No matches found", "The regex is valid; it just did not match this sample.");
            return;
          }
          updateResultBody(shell.resultBody, [
            buildMetricGrid([
              { label: "Matches", value: String(matches.length), caption: "total captures" },
              { label: "Flags", value: flagsInput.value || "none", caption: "active modifiers" }
            ]),
            createTable(
              ["Match", "Index"],
              matches.map(function (match) {
                return [match[0], String(match.index)];
              })
            )
          ]);
          ctx.setSuccessState(shell.resultPanel, "Matches ready", "Inspect the list to confirm the pattern behaves as expected.");
        } catch (error) {
          updateResultBody(shell.resultBody, createResultHero("Regex error", "Fix the expression or flags and try again."));
          ctx.setErrorState(shell.resultPanel, "Invalid regular expression", error.message);
        }
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("No matches yet", "Run the regex to inspect results."));
    ctx.setEmptyState(shell.resultPanel, "Tester idle", "Enter a pattern, flags, and sample text to begin.");
  }

  function renderDiffChecker(ctx) {
    const shell = ctx.renderToolShell({
      title: "Diff Checker",
      intro: "Compare two text blocks line by line and surface changed rows.",
      resultTitle: "Line differences"
    });
    const originalText = createTextarea("Original text", 10);
    const modifiedText = createTextarea("Modified text", 10);
    shell.controls.appendChild(makeField("Original", originalText));
    shell.controls.appendChild(makeField("Modified", modifiedText));

    shell.controls.appendChild(ctx.createActionButton({
      label: "Compare lines",
      icon: "compare_arrows",
      variant: "tonal",
      onClick: function () {
        if (!originalText.value.trim() && !modifiedText.value.trim()) {
          updateResultBody(shell.resultBody, createResultHero("No diff yet", "Add text to both inputs before comparing."));
          ctx.setEmptyState(shell.resultPanel, "Inputs missing", "Enter the original and modified text to compute a diff.");
          return;
        }
        const leftLines = originalText.value.split(/\r?\n/);
        const rightLines = modifiedText.value.split(/\r?\n/);
        const rows = [];
        const total = Math.max(leftLines.length, rightLines.length);
        for (let index = 0; index < total; index += 1) {
          const left = leftLines[index] || "";
          const right = rightLines[index] || "";
          if (left !== right) {
            rows.push(["Line " + (index + 1), left, right]);
          }
        }
        if (!rows.length) {
          updateResultBody(shell.resultBody, createResultHero("No differences", "The compared text blocks are identical line by line."));
          ctx.setSuccessState(shell.resultPanel, "No differences found", "Both inputs are the same across all lines.");
          return;
        }
        updateResultBody(shell.resultBody, [
          buildMetricGrid([
            { label: "Changed lines", value: String(rows.length), caption: "line-level diff" },
            { label: "Original lines", value: String(leftLines.length), caption: "left input" },
            { label: "Modified lines", value: String(rightLines.length), caption: "right input" }
          ]),
          createTable(["Line", "Original", "Modified"], rows)
        ]);
        ctx.setSuccessState(shell.resultPanel, "Differences ready", "Each changed line is listed in order.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("No diff yet", "Compare two text blocks to list line changes."));
    ctx.setEmptyState(shell.resultPanel, "Comparator idle", "Enter the original and modified text to compare.");
  }

  function createExpressionTool(ctx, tool, options) {
    const shell = ctx.renderToolShell({
      title: tool.name,
      intro: options.intro,
      resultTitle: options.resultTitle
    });

    const display = createInput("text", "", "");
    display.readOnly = true;
    shell.controls.appendChild(makeField(options.displayLabel || "Expression", display));

    const keypad = document.createElement("div");
    keypad.className = "compact-grid";
    keypad.style.gridTemplateColumns = "repeat(" + options.columns + ", minmax(0, 1fr))";
    shell.controls.appendChild(keypad);

    let expression = "";
    let lastResult = "";

    function renderCalculatorState(title, detail) {
      updateResultBody(shell.resultBody, [
        createResultHero(lastResult || "0", expression ? "Expression: " + expression : "Use the keypad to build an expression."),
        buildMetricGrid([
          { label: "Mode", value: options.modeLabel, caption: options.modeCaption },
          { label: "Expression length", value: String(expression.length), caption: "characters entered" }
        ])
      ]);
      if (expression || lastResult) {
        ctx.setSuccessState(shell.resultPanel, title, detail);
      } else {
        ctx.setEmptyState(shell.resultPanel, "Calculator ready", "Use the keypad to build an expression.");
      }
    }

    function safeEvaluate(value) {
      if (!value) {
        throw new Error("Enter an expression first.");
      }
      return options.evaluate(value);
    }

    function press(token) {
      if (token === "C") {
        expression = "";
        lastResult = "";
      } else if (token === "DEL") {
        expression = expression.slice(0, -1);
      } else if (token === "=") {
        const result = safeEvaluate(expression);
        lastResult = String(result);
        expression = String(result);
      } else {
        expression += token;
      }
      display.value = expression;
      renderCalculatorState("Calculation updated", "The current result reflects the expression shown above.");
    }

    options.buttons.forEach(function (token) {
      keypad.appendChild(ctx.createActionButton({
        label: token,
        icon: "calculate",
        variant: token === "=" ? "tonal" : "surface",
        onClick: function () {
          try {
            press(token);
          } catch (error) {
            lastResult = "";
            display.value = expression;
            updateResultBody(shell.resultBody, createResultHero("Error", error.message));
            ctx.setErrorState(shell.resultPanel, "Expression error", error.message);
          }
        }
      }));
    });

    renderCalculatorState();
  }

  function renderCalculator(ctx, tool) {
    createExpressionTool(ctx, tool, {
      intro: "A compact calculator for quick arithmetic inside the app.",
      resultTitle: "Calculation summary",
      displayLabel: "Expression",
      modeLabel: "Basic",
      modeCaption: "arithmetic only",
      columns: 4,
      buttons: ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+", "(", ")", "DEL", "C"],
      evaluate: function (expression) {
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
          throw new Error("Unsupported characters in expression.");
        }
        return Function('"use strict"; return (' + expression + ");")();
      }
    });
  }

  function renderScientificCalculator(ctx, tool) {
    createExpressionTool(ctx, tool, {
      intro: "A scientific keypad with trigonometry, log, roots, and constants.",
      resultTitle: "Scientific result",
      displayLabel: "Expression",
      modeLabel: "Scientific",
      modeCaption: "extended math functions",
      columns: 5,
      buttons: [
        "sin(",
        "cos(",
        "tan(",
        "log(",
        "sqrt(",
        "7",
        "8",
        "9",
        "/",
        "DEL",
        "4",
        "5",
        "6",
        "*",
        "(",
        "1",
        "2",
        "3",
        "-",
        ")",
        "0",
        ".",
        "^",
        "+",
        "C",
        "pi",
        "e",
        "="
      ],
      evaluate: function (expression) {
        if (!/^[0-9+\-*/().,\s^a-z]+$/i.test(expression)) {
          throw new Error("Unsupported characters in expression.");
        }
        const normalized = expression
          .replace(/\bpi\b/gi, "Math.PI")
          .replace(/\be\b/g, "Math.E")
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/\^/g, "**");
        return Function('"use strict"; return (' + normalized + ");")();
      }
    });
  }

  function renderTipCalculator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Tip Calculator",
      intro: "Split a bill with tip and show both the tip amount and per-person total.",
      resultTitle: "Bill breakdown"
    });
    const billInput = createInput("number", "", 86);
    const tipInput = createInput("number", "", 18);
    const peopleInput = createInput("number", "", 2);
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("Bill amount", billInput));
    grid.appendChild(makeField("Tip percent", tipInput));
    grid.appendChild(makeField("People", peopleInput));
    shell.controls.appendChild(grid);

    function update() {
      const bill = Number(billInput.value);
      const tipPercent = Number(tipInput.value);
      const people = Number(peopleInput.value);
      if (!Number.isFinite(bill) || !Number.isFinite(tipPercent) || !Number.isFinite(people) || people <= 0) {
        updateResultBody(shell.resultBody, createResultHero("$0.00", "Add the bill, tip percent, and party size."));
        ctx.setEmptyState(shell.resultPanel, "Incomplete bill data", "Enter all fields to compute the split.");
        return;
      }
      const tipAmount = bill * (tipPercent / 100);
      const total = bill + tipAmount;
      updateResultBody(shell.resultBody, [
        createResultHero("$" + total.toFixed(2), "Total bill with tip included."),
        buildMetricGrid([
          { label: "Tip amount", value: "$" + tipAmount.toFixed(2), caption: "overall tip" },
          { label: "Per person", value: "$" + (total / people).toFixed(2), caption: "split evenly" },
          { label: "Tip per person", value: "$" + (tipAmount / people).toFixed(2), caption: "gratuity share" }
        ])
      ]);
      ctx.setSuccessState(shell.resultPanel, "Split ready", "The tip and total are divided evenly across the party.");
    }

    [billInput, tipInput, peopleInput].forEach(function (input) {
      input.addEventListener("input", update);
    });
    update();
  }

  function renderBmiCalculator(ctx) {
    const shell = ctx.renderToolShell({
      title: "BMI Calculator",
      intro: "Estimate body mass index from weight and height, then categorize the result.",
      resultTitle: "BMI result"
    });
    const weightInput = createInput("number", "", 70);
    const heightInput = createInput("number", "", 172);
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("Weight (kg)", weightInput));
    grid.appendChild(makeField("Height (cm)", heightInput));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Calculate BMI",
      icon: "monitor_weight",
      variant: "tonal",
      onClick: function () {
        const weight = Number(weightInput.value);
        const heightCm = Number(heightInput.value);
        if (!weight || !heightCm) {
          updateResultBody(shell.resultBody, createResultHero("BMI pending", "Enter weight and height to calculate."));
          ctx.setEmptyState(shell.resultPanel, "Missing body data", "Provide both weight and height.");
          return;
        }
        const heightMeters = heightCm / 100;
        const bmi = weight / (heightMeters * heightMeters);
        const label = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
        updateResultBody(shell.resultBody, [
          createResultHero(bmi.toFixed(1), "Estimated BMI"),
          buildMetricGrid([
            { label: "Category", value: label, caption: "standard BMI range" },
            { label: "Weight", value: weight.toFixed(1) + " kg", caption: "input value" },
            { label: "Height", value: heightCm.toFixed(0) + " cm", caption: "input value" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "BMI calculated", "Use the category as a quick reference rather than medical advice.");
      }
    }));
    updateResultBody(shell.resultBody, createResultHero("BMI pending", "Enter weight and height to calculate."));
    ctx.setEmptyState(shell.resultPanel, "Calculator idle", "Provide height and weight to calculate BMI.");
  }

  function renderAgeCalculator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Age Calculator",
      intro: "Calculate age from a birth date with years, months, and days.",
      resultTitle: "Age result"
    });
    const birthInput = createInput("date", "");
    shell.controls.appendChild(makeField("Birth date", birthInput));

    shell.controls.appendChild(ctx.createActionButton({
      label: "Calculate age",
      icon: "cake",
      variant: "tonal",
      onClick: function () {
        if (!DateTime) {
          ctx.setErrorState(shell.resultPanel, "Time library missing", "Luxon is required for date calculations in this tool.");
          updateResultBody(shell.resultBody, createResultHero("Library missing", "The age calculator needs the bundled time library."));
          return;
        }
        if (!birthInput.value) {
          updateResultBody(shell.resultBody, createResultHero("Age pending", "Choose a birth date to calculate age."));
          ctx.setEmptyState(shell.resultPanel, "Birth date missing", "Select a birth date first.");
          return;
        }
        const birthDate = DateTime ? DateTime.fromISO(birthInput.value) : null;
        if (!birthDate || !birthDate.isValid) {
          ctx.setErrorState(shell.resultPanel, "Invalid date", "The selected date could not be parsed.");
          updateResultBody(shell.resultBody, createResultHero("Date error", "Please choose a valid birth date."));
          return;
        }
        const today = DateTime.now();
        const diff = today.diff(birthDate, ["years", "months", "days"]).toObject();
        updateResultBody(shell.resultBody, [
          createResultHero(Math.floor(diff.years) + " years", "Current age"),
          buildMetricGrid([
            { label: "Years", value: String(Math.floor(diff.years || 0)), caption: "full years" },
            { label: "Months", value: String(Math.floor(diff.months || 0)), caption: "remaining months" },
            { label: "Days", value: String(Math.floor(diff.days || 0)), caption: "remaining days" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Age calculated", "This is based on the current browser date.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("Age pending", "Choose a birth date to calculate age."));
    ctx.setEmptyState(shell.resultPanel, "Calculator idle", "Pick a birth date to generate the age breakdown.");
  }

  function renderPercentageCalculator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Percentage Calculator",
      intro: "Calculate what a percentage value represents for a given base amount.",
      resultTitle: "Percentage result"
    });
    const valueInput = createInput("number", "", 320);
    const percentInput = createInput("number", "", 12);
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("Base value", valueInput));
    grid.appendChild(makeField("Percent", percentInput));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Calculate percentage",
      icon: "percent",
      variant: "tonal",
      onClick: function () {
        const base = Number(valueInput.value);
        const percent = Number(percentInput.value);
        if (!Number.isFinite(base) || !Number.isFinite(percent)) {
          updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter both numbers to calculate."));
          ctx.setEmptyState(shell.resultPanel, "Missing values", "Provide the base value and percentage.");
          return;
        }
        const result = base * (percent / 100);
        updateResultBody(shell.resultBody, [
          createResultHero(String(result.toFixed(2)), percent + "% of " + base),
          buildMetricGrid([
            { label: "Base", value: String(base), caption: "starting value" },
            { label: "Percent", value: percent + "%", caption: "portion applied" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Percentage calculated", "The result shows the requested portion of the base value.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter both numbers to calculate."));
    ctx.setEmptyState(shell.resultPanel, "Calculator idle", "Provide the base value and percentage.");
  }

  function renderDiscountCalculator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Discount Calculator",
      intro: "Estimate the discounted price and how much you save from the original amount.",
      resultTitle: "Discount summary"
    });
    const priceInput = createInput("number", "", 149);
    const discountInput = createInput("number", "", 20);
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("Original price", priceInput));
    grid.appendChild(makeField("Discount percent", discountInput));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Calculate discount",
      icon: "sell",
      variant: "tonal",
      onClick: function () {
        const price = Number(priceInput.value);
        const discount = Number(discountInput.value);
        if (!Number.isFinite(price) || !Number.isFinite(discount)) {
          updateResultBody(shell.resultBody, createResultHero("$0.00", "Enter a price and discount rate."));
          ctx.setEmptyState(shell.resultPanel, "Missing pricing data", "Provide both a price and discount percent.");
          return;
        }
        const savings = price * (discount / 100);
        const finalPrice = price - savings;
        updateResultBody(shell.resultBody, [
          createResultHero("$" + finalPrice.toFixed(2), "Final price after discount"),
          buildMetricGrid([
            { label: "Savings", value: "$" + savings.toFixed(2), caption: "discount amount" },
            { label: "Original", value: "$" + price.toFixed(2), caption: "starting price" },
            { label: "Discount", value: discount + "%", caption: "rate applied" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Discount calculated", "The summary shows both the savings and the final amount.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("$0.00", "Enter a price and discount rate."));
    ctx.setEmptyState(shell.resultPanel, "Calculator idle", "Provide pricing information to calculate savings.");
  }

  function renderCurrencyConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Currency Converter",
      intro: "Convert between bundled currency rates stored locally in the app. Rates are static, not live market data.",
      resultTitle: "Converted amount"
    });
    const amountInput = createInput("number", "", 1);
    const fromSelect = createSelect(Object.keys(CURRENCY_RATES), "USD");
    const toSelect = createSelect(Object.keys(CURRENCY_RATES), "EUR");
    const grid = document.createElement("div");
    grid.className = "input-grid";
    grid.appendChild(makeField("Amount", amountInput));
    grid.appendChild(makeField("From", fromSelect));
    grid.appendChild(makeField("To", toSelect));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert amount",
      icon: "currency_exchange",
      variant: "tonal",
      onClick: function () {
        const amount = Number(amountInput.value);
        const from = fromSelect.value;
        const to = toSelect.value;
        if (!Number.isFinite(amount)) {
          updateResultBody(shell.resultBody, createResultHero("0.00", "Enter an amount to convert."));
          ctx.setEmptyState(shell.resultPanel, "Amount missing", "Provide the amount you want to convert.");
          return;
        }
        const result = (amount / CURRENCY_RATES[from]) * CURRENCY_RATES[to];
        updateResultBody(shell.resultBody, [
          createResultHero(result.toFixed(2) + " " + to, amount.toFixed(2) + " " + from),
          buildMetricGrid([
            { label: "Base rate", value: CURRENCY_RATES[from].toFixed(2), caption: from + " bundled rate" },
            { label: "Target rate", value: CURRENCY_RATES[to].toFixed(2), caption: to + " bundled rate" }
          ]),
          createRichPreview('<p class="supporting-copy">Bundled exchange rates are included for offline-style conversion logic, but they do not reflect live market data.</p>')
        ]);
        ctx.setSuccessState(shell.resultPanel, "Conversion ready", "These bundled rates are static and intended for quick estimates.");
      }
    }));
    updateResultBody(shell.resultBody, createResultHero("0.00", "Enter an amount to convert."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Enter the amount and choose both currencies.");
  }

  function renderImageResize(ctx, tool) {
    const workbench = buildImageWorkbench(ctx, tool, "Resize an uploaded image and export the updated preview.");
    const widthInput = createInput("number", "", "");
    const heightInput = createInput("number", "", "");
    const keepRatio = createBooleanLabel("Lock aspect ratio", true);
    const fields = document.createElement("div");
    fields.className = "split-fields";
    fields.appendChild(makeField("Width (px)", widthInput));
    fields.appendChild(makeField("Height (px)", heightInput));
    workbench.shell.controls.appendChild(fields);
    workbench.shell.controls.appendChild(keepRatio.root);

    workbench.fileInput.addEventListener("change", function () {
      window.setTimeout(function () {
        const current = workbench.getCurrent();
        if (current) {
          widthInput.value = String(current.width);
          heightInput.value = String(current.height);
        }
      }, 0);
    });

    widthInput.addEventListener("input", function () {
      const current = workbench.getCurrent();
      if (keepRatio.input.checked && current && Number(widthInput.value)) {
        heightInput.value = String(Math.round((Number(widthInput.value) / current.width) * current.height));
      }
    });

    heightInput.addEventListener("input", function () {
      const current = workbench.getCurrent();
      if (keepRatio.input.checked && current && Number(heightInput.value)) {
        widthInput.value = String(Math.round((Number(heightInput.value) / current.height) * current.width));
      }
    });

    const buttonRow = document.createElement("div");
    buttonRow.className = "action-row";
    buttonRow.appendChild(ctx.createActionButton({
      label: "Apply resize",
      icon: "photo_size_select_large",
      variant: "tonal",
      onClick: function () {
        const current = workbench.getCurrent();
        const width = Number(widthInput.value);
        const height = Number(heightInput.value);
        if (!current) {
          ctx.setEmptyState(workbench.shell.resultPanel, "No source image", "Upload an image before resizing it.");
          return;
        }
        if (!width || !height) {
          ctx.setErrorState(workbench.shell.resultPanel, "Invalid size", "Provide both width and height in pixels.");
          return;
        }
        loadImageElement(current.dataUrl).then(function (image) {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);
          return workbench.setCurrentFromUrl(canvas.toDataURL("image/png"), current.name);
        }).then(function () {
          ctx.setSuccessState(workbench.shell.resultPanel, "Image resized", "The preview now reflects the resized image.");
        });
      }
    }));
    buttonRow.appendChild(ctx.createActionButton({
      label: "Reset",
      icon: "restart_alt",
      variant: "surface",
      onClick: function () {
        const original = workbench.getOriginal();
        if (original) {
          workbench.resetToOriginal();
          widthInput.value = String(original.width);
          heightInput.value = String(original.height);
          ctx.setSuccessState(workbench.shell.resultPanel, "Original restored", "The source image has been restored.");
        }
      }
    }));
    workbench.shell.controls.appendChild(buttonRow);

    ctx.attachDownloadAction(workbench.shell.actions, {
      getPayload: function () {
        const current = workbench.getCurrent();
        return current ? { filename: "resized-image.png", url: current.dataUrl } : null;
      }
    });
  }

  function renderImageRotate(ctx, tool) {
    const workbench = buildImageWorkbench(ctx, tool, "Rotate and flip an uploaded image while preserving a live preview.");
    const row = document.createElement("div");
    row.className = "action-row";

    function transformCurrent(handler, successDetail) {
      const current = workbench.getCurrent();
      if (!current) {
        ctx.setEmptyState(workbench.shell.resultPanel, "No source image", "Upload an image before applying transforms.");
        return;
      }
      loadImageElement(current.dataUrl).then(function (image) {
        return handler(image);
      }).then(function (dataUrl) {
        return workbench.setCurrentFromUrl(dataUrl, current.name);
      }).then(function () {
        ctx.setSuccessState(workbench.shell.resultPanel, "Transform applied", successDetail);
      });
    }

    row.appendChild(ctx.createActionButton({
      label: "Rotate 90",
      icon: "crop_rotate",
      variant: "tonal",
      onClick: function () {
        transformCurrent(function (image) {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalHeight;
          canvas.height = image.naturalWidth;
          const context = canvas.getContext("2d");
          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate(Math.PI / 2);
          context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
          return canvas.toDataURL("image/png");
        }, "The image was rotated clockwise by 90 degrees.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Flip horizontal",
      icon: "swap_horiz",
      variant: "surface",
      onClick: function () {
        transformCurrent(function (image) {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
          context.drawImage(image, 0, 0);
          return canvas.toDataURL("image/png");
        }, "The image was flipped horizontally.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Flip vertical",
      icon: "swap_vert",
      variant: "surface",
      onClick: function () {
        transformCurrent(function (image) {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d");
          context.translate(0, canvas.height);
          context.scale(1, -1);
          context.drawImage(image, 0, 0);
          return canvas.toDataURL("image/png");
        }, "The image was flipped vertically.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Reset",
      icon: "restart_alt",
      variant: "surface",
      onClick: function () {
        if (workbench.getOriginal()) {
          workbench.resetToOriginal();
          ctx.setSuccessState(workbench.shell.resultPanel, "Original restored", "The preview has been reset to the original image.");
        }
      }
    }));
    workbench.shell.controls.appendChild(row);

    ctx.attachDownloadAction(workbench.shell.actions, {
      getPayload: function () {
        const current = workbench.getCurrent();
        return current ? { filename: "rotated-image.png", url: current.dataUrl } : null;
      }
    });
  }

  function renderImageCrop(ctx, tool) {
    const workbench = buildImageWorkbench(ctx, tool, "Apply a quick centered crop to reduce the image to its middle 50 percent.");
    const row = document.createElement("div");
    row.className = "action-row";

    row.appendChild(ctx.createActionButton({
      label: "Crop center 50%",
      icon: "crop",
      variant: "tonal",
      onClick: function () {
        const current = workbench.getCurrent();
        if (!current) {
          ctx.setEmptyState(workbench.shell.resultPanel, "No source image", "Upload an image before cropping.");
          return;
        }
        loadImageElement(current.dataUrl).then(function (image) {
          const cropWidth = Math.round(image.naturalWidth / 2);
          const cropHeight = Math.round(image.naturalHeight / 2);
          const offsetX = Math.round((image.naturalWidth - cropWidth) / 2);
          const offsetY = Math.round((image.naturalHeight - cropHeight) / 2);
          const canvas = document.createElement("canvas");
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          canvas.getContext("2d").drawImage(
            image,
            offsetX,
            offsetY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );
          return workbench.setCurrentFromUrl(canvas.toDataURL("image/png"), current.name);
        }).then(function () {
          ctx.setSuccessState(workbench.shell.resultPanel, "Crop applied", "The preview now shows the centered crop.");
        });
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Reset",
      icon: "restart_alt",
      variant: "surface",
      onClick: function () {
        if (workbench.getOriginal()) {
          workbench.resetToOriginal();
          ctx.setSuccessState(workbench.shell.resultPanel, "Original restored", "The source image has been restored.");
        }
      }
    }));
    workbench.shell.controls.appendChild(row);

    ctx.attachDownloadAction(workbench.shell.actions, {
      getPayload: function () {
        const current = workbench.getCurrent();
        return current ? { filename: "cropped-image.png", url: current.dataUrl } : null;
      }
    });
  }

  function renderImageToBase64(ctx, tool) {
    const workbench = buildImageWorkbench(ctx, tool, "Convert an uploaded image into a Base64 data URL with preview and export controls.");
    let output = "";

    workbench.shell.controls.appendChild(ctx.createActionButton({
      label: "Generate Base64",
      icon: "code",
      variant: "tonal",
      onClick: function () {
        const current = workbench.getCurrent();
        if (!current) {
          ctx.setEmptyState(workbench.shell.resultPanel, "No source image", "Upload an image before generating Base64.");
          return;
        }
        output = current.dataUrl;
        updateResultBody(workbench.shell.resultBody, [
          workbench.preview.root,
          createMonoBlock(output)
        ]);
        ctx.setSuccessState(workbench.shell.resultPanel, "Base64 ready", "The result includes the full data URL for the current preview.");
      }
    }));

    ctx.attachCopyAction(workbench.shell.actions, {
      getValue: function () {
        return output;
      },
      label: "Copy Base64"
    });
    ctx.attachDownloadAction(workbench.shell.actions, {
      getPayload: function () {
        const current = workbench.getCurrent();
        return current ? { filename: "image-data-url.txt", text: current.dataUrl, type: "text/plain;charset=utf-8" } : null;
      },
      label: "Download text"
    });
  }

  function renderQrGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "QR Generator",
      intro: "Create a downloadable QR code preview from text or a URL.",
      resultTitle: "QR preview"
    });
    const textInput = createTextarea("https://example.com", 6);
    shell.controls.appendChild(makeField("Text or URL", textInput));
    const preview = createPreviewStage("Enter text or a URL, then generate a QR code.");
    shell.resultBody.appendChild(preview.root);
    let qrDataUrl = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate QR",
      icon: "qr_code_2",
      variant: "tonal",
      onClick: function () {
        if (!textInput.value.trim()) {
          preview.setMessage("Enter text or a URL, then generate a QR code.");
          preview.setMetrics([]);
          ctx.setEmptyState(shell.resultPanel, "No QR content yet", "Add text or a URL to generate a QR code.");
          return;
        }
        if (typeof window.qrcode !== "function") {
          preview.setMessage("The QR library is unavailable.");
          preview.setMetrics([]);
          ctx.setErrorState(shell.resultPanel, "QR library missing", "The QR generator library did not load.");
          return;
        }
        const qr = window.qrcode(0, "M");
        qr.addData(textInput.value);
        qr.make();
        qrDataUrl = qr.createDataURL(8, 4);
        const image = document.createElement("img");
        image.alt = "Generated QR code";
        image.src = qrDataUrl;
        preview.setNode(image);
        preview.setMetrics([
          { label: "Characters", value: String(textInput.value.length), caption: "input length" },
          { label: "Error level", value: "M", caption: "balanced recovery" }
        ]);
        ctx.setSuccessState(shell.resultPanel, "QR ready", "The generated QR can now be downloaded or the source copied.");
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return textInput.value;
      },
      label: "Copy source"
    });
    ctx.attachDownloadAction(shell.actions, {
      getPayload: function () {
        return qrDataUrl ? { filename: "qr-code.png", url: qrDataUrl } : null;
      }
    });
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Enter text or a URL to build the QR code.");
  }

  function renderBarcodeGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Barcode Generator",
      intro: "Generate a CODE128 barcode with a live SVG preview and download action.",
      resultTitle: "Barcode preview"
    });
    const textInput = createInput("text", "123456789012");
    shell.controls.appendChild(makeField("Value", textInput));
    const preview = createPreviewStage("Enter a value, then generate the barcode.");
    shell.resultBody.appendChild(preview.root);
    let svgMarkup = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate barcode",
      icon: "qr_code_scanner",
      variant: "tonal",
      onClick: function () {
        if (!textInput.value.trim()) {
          preview.setMessage("Enter a value, then generate the barcode.");
          preview.setMetrics([]);
          ctx.setEmptyState(shell.resultPanel, "No barcode content", "Provide a value before generating the barcode.");
          return;
        }
        if (typeof window.JsBarcode !== "function") {
          preview.setMessage("The barcode library is unavailable.");
          preview.setMetrics([]);
          ctx.setErrorState(shell.resultPanel, "Barcode library missing", "The barcode generator library did not load.");
          return;
        }
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        try {
          window.JsBarcode(svg, textInput.value, {
            format: "CODE128",
            displayValue: true,
            background: "transparent",
            lineColor: "currentColor"
          });
          preview.setNode(svg);
          svgMarkup = new XMLSerializer().serializeToString(svg);
          preview.setMetrics([
            { label: "Characters", value: String(textInput.value.length), caption: "encoded into CODE128" },
            { label: "Format", value: "CODE128", caption: "barcode symbology" }
          ]);
          ctx.setSuccessState(shell.resultPanel, "Barcode ready", "The SVG preview can be downloaded for further use.");
        } catch (error) {
          ctx.setErrorState(shell.resultPanel, "Barcode generation failed", error.message);
          preview.setMessage("The provided content could not be encoded.");
        }
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return textInput.value;
      },
      label: "Copy source"
    });
    ctx.attachDownloadAction(shell.actions, {
      getPayload: function () {
        return svgMarkup
          ? { filename: "barcode.svg", text: svgMarkup, type: "image/svg+xml;charset=utf-8" }
          : null;
      },
      label: "Download SVG"
    });
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Provide a value to generate the barcode.");
  }

  function renderColorConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Color Converter",
      intro: "Convert between HEX and RGB and preview the resulting swatch.",
      resultTitle: "Color preview"
    });
    const hexInput = createInput("text", "#0e6674");
    const rgbInput = createInput("text", "14, 102, 116");
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("HEX", hexInput));
    grid.appendChild(makeField("RGB", rgbInput));
    shell.controls.appendChild(grid);

    function renderColor(hex, rgb) {
      const swatch = document.createElement("div");
      swatch.className = "result-hero";
      swatch.style.background = hex;
      swatch.style.color = "#ffffff";
      swatch.innerHTML = '<div class="result-hero__value">' + hex.toUpperCase() + '</div><p class="result-hero__caption">RGB ' + rgb + "</p>";
      updateResultBody(shell.resultBody, swatch);
      ctx.setSuccessState(shell.resultPanel, "Color converted", "The swatch uses the converted color value.");
    }

    function hexToRgb() {
      const value = hexInput.value.trim().replace("#", "");
      if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        ctx.setErrorState(shell.resultPanel, "Invalid HEX value", "Use a six-digit color like #0e6674.");
        return;
      }
      const rgb = [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16)
      ];
      rgbInput.value = rgb.join(", ");
      renderColor("#" + value, rgb.join(", "));
    }

    function rgbToHex() {
      const parts = rgbInput.value.split(",").map(function (segment) {
        return Number(segment.trim());
      });
      if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part) || part < 0 || part > 255; })) {
        ctx.setErrorState(shell.resultPanel, "Invalid RGB value", "Use three comma-separated values between 0 and 255.");
        return;
      }
      const hex = "#" + parts.map(function (part) {
        return part.toString(16).padStart(2, "0");
      }).join("");
      hexInput.value = hex;
      renderColor(hex, parts.join(", "));
    }

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "HEX to RGB",
      icon: "palette",
      variant: "tonal",
      onClick: hexToRgb
    }));
    row.appendChild(ctx.createActionButton({
      label: "RGB to HEX",
      icon: "palette",
      variant: "surface",
      onClick: rgbToHex
    }));
    shell.controls.appendChild(row);

    renderColor("#0e6674", "14, 102, 116");
  }

  function renderUnitConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Unit Converter",
      intro: "Convert between a small set of high-frequency unit pairs with clear direction labels.",
      resultTitle: "Converted unit"
    });
    const valueInput = createInput("number", "", 1);
    const modeSelect = createSelect([
      { value: "m-ft", label: "Meters to feet" },
      { value: "ft-m", label: "Feet to meters" },
      { value: "kg-lb", label: "Kilograms to pounds" },
      { value: "lb-kg", label: "Pounds to kilograms" }
    ], "m-ft");
    shell.controls.appendChild(makeField("Value", valueInput));
    shell.controls.appendChild(makeField("Conversion", modeSelect));

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert unit",
      icon: "straighten",
      variant: "tonal",
      onClick: function () {
        const value = Number(valueInput.value);
        if (!Number.isFinite(value)) {
          updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter a numeric value to convert."));
          ctx.setEmptyState(shell.resultPanel, "Missing value", "Provide a number before converting.");
          return;
        }
        const mode = modeSelect.value;
        const mappings = {
          "m-ft": { multiplier: 3.28084, unit: "ft", label: "Meters to feet" },
          "ft-m": { multiplier: 0.3048, unit: "m", label: "Feet to meters" },
          "kg-lb": { multiplier: 2.20462, unit: "lb", label: "Kilograms to pounds" },
          "lb-kg": { multiplier: 0.453592, unit: "kg", label: "Pounds to kilograms" }
        };
        const result = value * mappings[mode].multiplier;
        updateResultBody(shell.resultBody, [
          createResultHero(result.toFixed(2) + " " + mappings[mode].unit, mappings[mode].label),
          buildMetricGrid([
            { label: "Input", value: String(value), caption: "source quantity" },
            { label: "Multiplier", value: mappings[mode].multiplier.toFixed(5), caption: "conversion factor" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Unit converted", "The selected conversion factor has been applied.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter a numeric value to convert."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Provide a value and choose a unit direction.");
  }

  function renderBase64Tool(ctx) {
    const shell = ctx.renderToolShell({
      title: "Base64 Encode and Decode",
      intro: "Convert between UTF-8 text and Base64 with clearer validation and copy controls.",
      resultTitle: "Base64 result"
    });
    const textarea = createTextarea("Paste text or Base64 content here.", 12);
    shell.controls.appendChild(makeField("Input", textarea));
    let output = "";

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Encode",
      icon: "lock",
      variant: "tonal",
      onClick: function () {
        if (!textarea.value) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("No output yet", "Enter text to encode."));
          ctx.setEmptyState(shell.resultPanel, "No input", "Provide text before encoding.");
          return;
        }
        output = safeTextToBase64(textarea.value);
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Base64 encoded", "The input text was converted into Base64.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Decode",
      icon: "lock_open",
      variant: "surface",
      onClick: function () {
        if (!textarea.value.trim()) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("No output yet", "Enter Base64 content to decode."));
          ctx.setEmptyState(shell.resultPanel, "No input", "Provide Base64 content before decoding.");
          return;
        }
        try {
          output = safeBase64ToText(textarea.value.trim());
          updateResultBody(shell.resultBody, createMonoBlock(output));
          ctx.setSuccessState(shell.resultPanel, "Base64 decoded", "The input was decoded as UTF-8 text.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Decode error", "The provided content is not valid Base64."));
          ctx.setErrorState(shell.resultPanel, "Invalid Base64", "Only valid Base64 input can be decoded.");
        }
      }
    }));
    shell.controls.appendChild(row);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "Choose Encode or Decode to create output."));
    ctx.setEmptyState(shell.resultPanel, "Tool idle", "Provide input text or Base64 content.");
  }

  function renderUrlEncoder(ctx) {
    const shell = ctx.renderToolShell({
      title: "URL Encoder",
      intro: "Encode or decode URL-safe strings without leaving the browser.",
      resultTitle: "URL-safe result"
    });
    const textarea = createTextarea("https://example.com/search?q=tools super app", 10);
    shell.controls.appendChild(makeField("Input", textarea));
    let output = "";

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Encode",
      icon: "link",
      variant: "tonal",
      onClick: function () {
        output = encodeURIComponent(textarea.value);
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "URL encoded", "Unsafe URL characters were percent-encoded.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Decode",
      icon: "link_off",
      variant: "surface",
      onClick: function () {
        try {
          output = decodeURIComponent(textarea.value);
          updateResultBody(shell.resultBody, createMonoBlock(output));
          ctx.setSuccessState(shell.resultPanel, "URL decoded", "Percent-encoded content was decoded.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Decode error", "The provided string could not be URL-decoded."));
          ctx.setErrorState(shell.resultPanel, "Invalid encoded URL", "Check that the input contains valid percent-encoded values.");
        }
      }
    }));
    shell.controls.appendChild(row);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "Encode or decode the current URL content."));
    ctx.setEmptyState(shell.resultPanel, "Tool idle", "Enter a URL or encoded string.");
  }

  function renderUuidGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "UUID Generator",
      intro: "Generate RFC4122-style UUID v4 values using browser crypto.",
      resultTitle: "Generated UUID"
    });
    let output = "";

    function generateUuid() {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes).map(function (value) {
        return value.toString(16).padStart(2, "0");
      });
      output = [
        hex.slice(0, 4).join(""),
        hex.slice(4, 6).join(""),
        hex.slice(6, 8).join(""),
        hex.slice(8, 10).join(""),
        hex.slice(10, 16).join("")
      ].join("-");
      updateResultBody(shell.resultBody, createMonoBlock(output));
      ctx.setSuccessState(shell.resultPanel, "UUID generated", "A new random identifier was created using browser crypto.");
    }

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate UUID",
      icon: "fingerprint",
      variant: "tonal",
      onClick: generateUuid
    }));
    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No UUID yet", "Generate a new random identifier."));
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Run the UUID generator to create a value.");
  }

  function renderStopwatch(ctx) {
    const shell = ctx.renderToolShell({
      title: "Stopwatch",
      intro: "Track elapsed time with start, pause, and reset controls.",
      resultTitle: "Elapsed time"
    });
    let elapsed = 0;
    let running = false;
    let timer = null;

    function formatElapsed(time) {
      const totalSeconds = Math.floor(time / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      const tenths = String(Math.floor((time % 1000) / 100));
      return minutes + ":" + seconds + "." + tenths;
    }

    function render() {
      updateResultBody(shell.resultBody, [
        createResultHero(formatElapsed(elapsed), running ? "Stopwatch is running." : "Stopwatch is paused."),
        buildMetricGrid([
          { label: "Milliseconds", value: String(elapsed), caption: "raw elapsed time" },
          { label: "State", value: running ? "Running" : "Paused", caption: "current stopwatch state" }
        ])
      ]);
      ctx.setSuccessState(shell.resultPanel, "Stopwatch ready", "Use start, pause, and reset to control the timer.");
    }

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Start",
      icon: "play_arrow",
      variant: "tonal",
      onClick: function () {
        if (running) {
          return;
        }
        running = true;
        const start = Date.now() - elapsed;
        timer = window.setInterval(function () {
          elapsed = Date.now() - start;
          render();
        }, 100);
        render();
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Pause",
      icon: "pause",
      variant: "surface",
      onClick: function () {
        running = false;
        window.clearInterval(timer);
        render();
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Reset",
      icon: "restart_alt",
      variant: "surface",
      onClick: function () {
        running = false;
        window.clearInterval(timer);
        elapsed = 0;
        render();
      }
    }));
    shell.controls.appendChild(row);
    render();
    return {
      dispose: function () {
        window.clearInterval(timer);
      }
    };
  }

  function renderHashGenerator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Hash Generator",
      intro: "Generate MD5, SHA-1, or SHA-256 hashes with actual browser-side implementations.",
      resultTitle: "Hash output"
    });
    const textarea = createTextarea("Hash this content", 10);
    const algorithmSelect = createSelect(["SHA-256", "SHA-1", "MD5"], "SHA-256");
    shell.controls.appendChild(makeField("Input", textarea));
    shell.controls.appendChild(makeField("Algorithm", algorithmSelect));
    let output = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate hash",
      icon: "tag",
      variant: "tonal",
      onClick: function () {
        try {
          if (!textarea.value) {
            output = "";
            updateResultBody(shell.resultBody, createResultHero("No hash yet", "Provide input text before hashing."));
            ctx.setEmptyState(shell.resultPanel, "No input", "Add text before generating a hash.");
            return;
          }
          if (!window.CryptoJS) {
            throw new Error("The hashing library is unavailable.");
          }
          const algorithm = algorithmSelect.value;
          if (algorithm === "MD5") {
            output = window.CryptoJS.MD5(textarea.value).toString();
          } else if (algorithm === "SHA-1") {
            output = window.CryptoJS.SHA1(textarea.value).toString();
          } else {
            output = window.CryptoJS.SHA256(textarea.value).toString();
          }
          updateResultBody(shell.resultBody, [
            createMonoBlock(output),
            buildMetricGrid([
              { label: "Algorithm", value: algorithm, caption: "selected digest" },
              { label: "Characters", value: String(textarea.value.length), caption: "source length" }
            ])
          ]);
          ctx.setSuccessState(shell.resultPanel, "Hash generated", "The digest was computed locally in the browser.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Hash unavailable", error.message));
          ctx.setErrorState(shell.resultPanel, "Hash generation failed", error.message);
        }
      }
    }));
    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No hash yet", "Provide input text before hashing."));
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Add text and choose the hashing algorithm.");
  }

  function renderPasswordStrength(ctx) {
    const shell = ctx.renderToolShell({
      title: "Password Strength",
      intro: "Score a password based on length and character diversity, then review the improvement tips.",
      resultTitle: "Strength analysis"
    });
    const input = createInput("password", "Type a password to evaluate");
    shell.controls.appendChild(makeField("Password", input));

    function update() {
      if (!input.value) {
        updateResultBody(shell.resultBody, createResultHero("Waiting", "Enter a password to evaluate its strength."));
        ctx.setEmptyState(shell.resultPanel, "No password entered", "Type a password to analyze it.");
        return;
      }
      const report = evaluatePasswordStrength(input.value);
      const tips = document.createElement("div");
      tips.className = "rich-preview";
      tips.innerHTML = "<strong>Improvement tips</strong>";
      const list = document.createElement("ul");
      list.className = "supporting-copy";
      (report.tips.length ? report.tips : ["This password already checks the main strength boxes."]).forEach(function (tip) {
        const item = document.createElement("li");
        item.textContent = tip;
        list.appendChild(item);
      });
      tips.appendChild(list);
      updateResultBody(shell.resultBody, [
        createResultHero(report.label, "Strength score: " + report.score + " / 6"),
        buildMetricGrid([
          { label: "Length", value: String(input.value.length), caption: "characters" },
          { label: "Uppercase", value: /[A-Z]/.test(input.value) ? "Yes" : "No", caption: "mixed case check" },
          { label: "Numbers", value: /[0-9]/.test(input.value) ? "Yes" : "No", caption: "digit check" },
          { label: "Symbols", value: /[^A-Za-z0-9]/.test(input.value) ? "Yes" : "No", caption: "special characters" }
        ]),
        tips
      ]);
      ctx.setSuccessState(shell.resultPanel, "Analysis ready", "Use the tips to improve weak or fair passwords.");
    }

    input.addEventListener("input", update);
    update();
  }

  function renderMorseTranslator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Morse Code",
      intro: "Convert text to Morse or decode Morse back into plain text.",
      resultTitle: "Translation result"
    });
    const textarea = createTextarea("HELLO WORLD", 10);
    shell.controls.appendChild(makeField("Input", textarea));
    let output = "";

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Text to Morse",
      icon: "translate",
      variant: "tonal",
      onClick: function () {
        output = textarea.value.toUpperCase().split("").map(function (character) {
          if (character === " ") {
            return "/";
          }
          return MORSE_MAP[character] || character;
        }).join(" ");
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Morse output ready", "The source text was converted to Morse symbols.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Morse to Text",
      icon: "translate",
      variant: "surface",
      onClick: function () {
        output = textarea.value
          .split(" ")
          .map(function (token) {
            if (token === "/") {
              return " ";
            }
            return MORSE_REVERSE[token] || token;
          })
          .join("");
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Text output ready", "The Morse sequence was decoded back to text.");
      }
    }));
    shell.controls.appendChild(row);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "Choose a translation direction to generate output."));
    ctx.setEmptyState(shell.resultPanel, "Translator idle", "Provide text or Morse code, then choose a direction.");
  }

  function renderBinaryConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Binary Converter",
      intro: "Convert text to binary or decode binary back to plain text.",
      resultTitle: "Binary result"
    });
    const textarea = createTextarea("Hello", 10);
    shell.controls.appendChild(makeField("Input", textarea));
    let output = "";

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Text to binary",
      icon: "memory",
      variant: "tonal",
      onClick: function () {
        output = textarea.value.split("").map(function (character) {
          return character.charCodeAt(0).toString(2).padStart(8, "0");
        }).join(" ");
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Binary ready", "The text was converted into eight-bit binary values.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Binary to text",
      icon: "memory",
      variant: "surface",
      onClick: function () {
        try {
          const tokens = textarea.value.trim().split(/\s+/);
          if (!tokens.every(function (token) { return /^[01]{8}$/.test(token); })) {
            throw new Error("Use space-separated 8-bit binary values.");
          }
          output = tokens.map(function (token) {
            return String.fromCharCode(parseInt(token, 2));
          }).join("");
          updateResultBody(shell.resultBody, createMonoBlock(output));
          ctx.setSuccessState(shell.resultPanel, "Text restored", "The binary sequence was decoded into plain text.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Decode error", "The input is not valid binary data."));
          ctx.setErrorState(shell.resultPanel, "Invalid binary", "Use space-separated 8-bit binary values.");
        }
      }
    }));
    shell.controls.appendChild(row);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "Choose a conversion direction to generate output."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Provide text or binary input.");
  }

  function renderCsvToJson(ctx) {
    const shell = ctx.renderToolShell({
      title: "CSV to JSON",
      intro: "Parse CSV into a formatted JSON array with a more robust quoted-cell parser.",
      resultTitle: "JSON output"
    });
    const textarea = createTextarea("name,score\nAva,91\nNoah,88", 12);
    shell.controls.appendChild(makeField("CSV input", textarea));
    let output = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert to JSON",
      icon: "table_chart",
      variant: "tonal",
      onClick: function () {
        if (!textarea.value.trim()) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("No JSON yet", "Paste CSV data before converting."));
          ctx.setEmptyState(shell.resultPanel, "No CSV provided", "Add CSV rows before converting.");
          return;
        }
        try {
          const rows = parseCsv(textarea.value.trim());
          const headers = rows[0];
          const records = rows.slice(1).map(function (row) {
            return headers.reduce(function (accumulator, header, index) {
              accumulator[header] = row[index] == null ? "" : row[index];
              return accumulator;
            }, {});
          });
          output = JSON.stringify(records, null, 2);
          updateResultBody(shell.resultBody, [
            buildMetricGrid([
              { label: "Rows", value: String(records.length), caption: "excluding header" },
              { label: "Columns", value: String(headers.length), caption: "header count" }
            ]),
            createMonoBlock(output)
          ]);
          ctx.setSuccessState(shell.resultPanel, "JSON ready", "The CSV rows were converted into a JSON array.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Parse error", "The CSV input could not be parsed."));
          ctx.setErrorState(shell.resultPanel, "CSV parse failed", error.message || "Check the CSV structure and try again.");
        }
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No JSON yet", "Paste CSV data before converting."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Add CSV content to generate JSON.");
  }

  function renderJsonToCsv(ctx) {
    const shell = ctx.renderToolShell({
      title: "JSON to CSV",
      intro: "Convert a JSON array into CSV while escaping quoted values correctly.",
      resultTitle: "CSV output"
    });
    const textarea = createTextarea('[{"name":"Ava","score":91},{"name":"Noah","score":88}]', 12);
    shell.controls.appendChild(makeField("JSON input", textarea));
    let output = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert to CSV",
      icon: "table_rows",
      variant: "tonal",
      onClick: function () {
        try {
          const records = JSON.parse(textarea.value);
          if (
            !Array.isArray(records) ||
            !records.length ||
            typeof records[0] !== "object" ||
            records[0] === null ||
            Array.isArray(records[0])
          ) {
            throw new Error("Provide a JSON array with at least one object.");
          }
          const headers = Object.keys(records[0]);
          const rows = [headers].concat(records.map(function (record) {
            return headers.map(function (header) {
              return record[header];
            });
          }));
          output = stringifyCsv(rows);
          updateResultBody(shell.resultBody, [
            buildMetricGrid([
              { label: "Rows", value: String(records.length), caption: "records converted" },
              { label: "Columns", value: String(headers.length), caption: "headers included" }
            ]),
            createMonoBlock(output)
          ]);
          ctx.setSuccessState(shell.resultPanel, "CSV ready", "The JSON array was converted into CSV rows.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Conversion error", "The JSON input is not a valid array of objects."));
          ctx.setErrorState(shell.resultPanel, "JSON conversion failed", error.message);
        }
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No CSV yet", "Paste a JSON array to convert it to CSV."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Provide a JSON array of objects.");
  }

  function renderTimezoneConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Time Zone Converter",
      intro: "Interpret the input in the selected source zone, then convert it into the target zone with a correct zone-aware calculation.",
      resultTitle: "Converted time"
    });
    const timeInput = createInput("datetime-local", "");
    const fromSelect = createSelect(TIME_ZONES, "UTC");
    const toSelect = createSelect(TIME_ZONES, "America/Los_Angeles");
    const grid = document.createElement("div");
    grid.className = "input-grid";
    grid.appendChild(makeField("Date and time", timeInput));
    grid.appendChild(makeField("From zone", fromSelect));
    grid.appendChild(makeField("To zone", toSelect));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert time zone",
      icon: "schedule",
      variant: "tonal",
      onClick: function () {
        if (!DateTime) {
          ctx.setErrorState(shell.resultPanel, "Time library missing", "Luxon is required for accurate time zone conversion.");
          return;
        }
        if (!timeInput.value) {
          updateResultBody(shell.resultBody, createResultHero("No conversion yet", "Pick a date and time before converting."));
          ctx.setEmptyState(shell.resultPanel, "No datetime selected", "Choose a date and time to convert.");
          return;
        }
        const fromZone = fromSelect.value;
        const toZone = toSelect.value;
        const source = DateTime.fromISO(timeInput.value, { zone: fromZone });
        if (!source.isValid) {
          ctx.setErrorState(shell.resultPanel, "Invalid datetime", source.invalidExplanation || "The source date could not be parsed.");
          return;
        }
        const converted = source.setZone(toZone);
        updateResultBody(shell.resultBody, [
          createResultHero(converted.toFormat("ccc, dd LLL yyyy HH:mm"), toZone),
          buildMetricGrid([
            { label: "Source", value: source.toFormat("ccc, dd LLL yyyy HH:mm"), caption: fromZone },
            { label: "Target", value: converted.toFormat("ccc, dd LLL yyyy HH:mm"), caption: toZone },
            { label: "UTC offset", value: converted.toFormat("ZZ"), caption: "target zone offset" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Time converted", "The source zone was honored before converting to the target zone.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("No conversion yet", "Pick a date and time before converting."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Select a datetime and both source and target zones.");
  }

  function renderDataSizeConverter(ctx) {
    const shell = ctx.renderToolShell({
      title: "Data Size Converter",
      intro: "Convert between bytes, KB, MB, GB, and TB with binary base units.",
      resultTitle: "Converted size"
    });
    const valueInput = createInput("number", "", 1);
    const fromSelect = createSelect(["B", "KB", "MB", "GB", "TB"], "MB");
    const toSelect = createSelect(["B", "KB", "MB", "GB", "TB"], "GB");
    const grid = document.createElement("div");
    grid.className = "input-grid";
    grid.appendChild(makeField("Value", valueInput));
    grid.appendChild(makeField("From", fromSelect));
    grid.appendChild(makeField("To", toSelect));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Convert size",
      icon: "storage",
      variant: "tonal",
      onClick: function () {
        const value = Number(valueInput.value);
        if (!Number.isFinite(value)) {
          updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter a numeric value to convert."));
          ctx.setEmptyState(shell.resultPanel, "Missing value", "Provide a data size before converting.");
          return;
        }
        const units = {
          B: 1,
          KB: 1024,
          MB: 1024 * 1024,
          GB: 1024 * 1024 * 1024,
          TB: 1024 * 1024 * 1024 * 1024
        };
        const bytes = value * units[fromSelect.value];
        const result = bytes / units[toSelect.value];
        updateResultBody(shell.resultBody, [
          createResultHero(result.toFixed(4) + " " + toSelect.value, value + " " + fromSelect.value),
          buildMetricGrid([
            { label: "Bytes", value: ctx.formatNumber(bytes, 0), caption: "canonical base unit" },
            { label: "From unit", value: fromSelect.value, caption: "source unit" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Data size converted", "Binary 1024-based units were used for the conversion.");
      }
    }));

    updateResultBody(shell.resultBody, createResultHero("Result pending", "Enter a numeric value to convert."));
    ctx.setEmptyState(shell.resultPanel, "Converter idle", "Provide a size and choose source and target units.");
  }

  function renderCharMap(ctx) {
    const shell = ctx.renderToolShell({
      title: "ASCII Table",
      intro: "Browse the first 128 ASCII characters with decimal and hexadecimal references.",
      resultTitle: "ASCII reference"
    });
    const rows = Array.from({ length: 128 }, function (_, index) {
      const character = index < 32 ? "" : String.fromCharCode(index);
      return [String(index), "0x" + index.toString(16).toUpperCase().padStart(2, "0"), character];
    });
    updateResultBody(shell.resultBody, createTable(["Dec", "Hex", "Char"], rows));
    ctx.setSuccessState(shell.resultPanel, "ASCII table ready", "Scroll through the table to inspect character codes.");
  }

  function renderJwtDecoder(ctx) {
    const shell = ctx.renderToolShell({
      title: "JWT Decoder",
      intro: "Decode a JWT locally and inspect both the header and payload without verification.",
      resultTitle: "Decoded token"
    });
    const textarea = createTextarea("Paste a JWT token here.", 10);
    shell.controls.appendChild(makeField("JWT token", textarea));
    let output = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Decode token",
      icon: "key",
      variant: "tonal",
      onClick: function () {
        try {
          const parts = textarea.value.trim().split(".");
          if (parts.length !== 3) {
            throw new Error("A JWT must contain three dot-separated sections.");
          }
          const header = JSON.parse(decodeBase64Url(parts[0]));
          const payload = JSON.parse(decodeBase64Url(parts[1]));
          output = JSON.stringify({ header: header, payload: payload }, null, 2);
          const headerBlock = document.createElement("div");
          headerBlock.className = "rich-preview";
          const headerTitle = document.createElement("strong");
          headerTitle.textContent = "Header";
          headerBlock.appendChild(headerTitle);
          headerBlock.appendChild(createMonoBlock(JSON.stringify(header, null, 2)));
          const payloadBlock = document.createElement("div");
          payloadBlock.className = "rich-preview";
          const payloadTitle = document.createElement("strong");
          payloadTitle.textContent = "Payload";
          payloadBlock.appendChild(payloadTitle);
          payloadBlock.appendChild(createMonoBlock(JSON.stringify(payload, null, 2)));
          updateResultBody(shell.resultBody, [headerBlock, payloadBlock]);
          ctx.setSuccessState(shell.resultPanel, "Token decoded", "Header and payload were decoded locally without signature verification.");
        } catch (error) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("Decode error", "The provided JWT could not be decoded."));
          ctx.setErrorState(shell.resultPanel, "Invalid JWT", error.message);
        }
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      },
      label: "Copy decoded JSON"
    });
    updateResultBody(shell.resultBody, createResultHero("No decoded token yet", "Paste a JWT and decode it to inspect the payload."));
    ctx.setEmptyState(shell.resultPanel, "Decoder idle", "Provide a JWT to inspect the decoded sections.");
  }

  function renderRandomNumber(ctx) {
    const shell = ctx.renderToolShell({
      title: "Random Number",
      intro: "Generate a random integer between a minimum and maximum value.",
      resultTitle: "Generated number"
    });
    const minInput = createInput("number", "", 1);
    const maxInput = createInput("number", "", 100);
    const grid = document.createElement("div");
    grid.className = "split-fields";
    grid.appendChild(makeField("Minimum", minInput));
    grid.appendChild(makeField("Maximum", maxInput));
    shell.controls.appendChild(grid);

    shell.controls.appendChild(ctx.createActionButton({
      label: "Generate number",
      icon: "casino",
      variant: "tonal",
      onClick: function () {
        const min = Number(minInput.value);
        const max = Number(maxInput.value);
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
          updateResultBody(shell.resultBody, createResultHero("Range error", "Ensure the maximum is greater than or equal to the minimum."));
          ctx.setErrorState(shell.resultPanel, "Invalid range", "Use numeric minimum and maximum values where max is at least min.");
          return;
        }
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        updateResultBody(shell.resultBody, [
          createResultHero(String(result), "Random integer in range"),
          buildMetricGrid([
            { label: "Minimum", value: String(min), caption: "lower bound" },
            { label: "Maximum", value: String(max), caption: "upper bound" }
          ])
        ]);
        ctx.setSuccessState(shell.resultPanel, "Number generated", "A new random integer was selected from the chosen range.");
      }
    }));
    updateResultBody(shell.resultBody, createResultHero("Waiting", "Choose a range and generate a number."));
    ctx.setEmptyState(shell.resultPanel, "Generator idle", "Set a minimum and maximum first.");
  }

  function renderEmojiTranslator(ctx) {
    const shell = ctx.renderToolShell({
      title: "Emoji Translator",
      intro: "Replace supported text tokens with emoji and convert the emoji back into text markers.",
      resultTitle: "Translation result"
    });
    const textarea = createTextarea("Launch day looks :fire: and ready to go :rocket:", 10);
    shell.controls.appendChild(makeField("Input", textarea));
    let output = "";

    const row = document.createElement("div");
    row.className = "action-row";
    row.appendChild(ctx.createActionButton({
      label: "Text to emoji",
      icon: "mood",
      variant: "tonal",
      onClick: function () {
        output = textarea.value;
        Object.keys(EMOJI_MAP).forEach(function (token) {
          output = output.split(token).join(EMOJI_MAP[token]);
        });
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Emoji output ready", "Supported text tokens were replaced with emoji.");
      }
    }));
    row.appendChild(ctx.createActionButton({
      label: "Emoji to text",
      icon: "mood_bad",
      variant: "surface",
      onClick: function () {
        output = textarea.value;
        Object.keys(EMOJI_REVERSE).forEach(function (token) {
          output = output.split(token).join(EMOJI_REVERSE[token]);
        });
        updateResultBody(shell.resultBody, createMonoBlock(output));
        ctx.setSuccessState(shell.resultPanel, "Text output ready", "Supported emoji were converted back into text tokens.");
      }
    }));
    shell.controls.appendChild(row);

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No translation yet", "Choose a direction to translate text and emoji."));
    ctx.setEmptyState(shell.resultPanel, "Translator idle", "Provide text or emoji and choose a direction.");
  }

  function renderCssMinifier(ctx) {
    const shell = ctx.renderToolShell({
      title: "CSS Minifier",
      intro: "Strip comments and compress CSS whitespace for a compact browser-side output.",
      resultTitle: "Minified CSS"
    });
    const textarea = createTextarea(".card {\n  padding: 16px;\n  color: #0e6674;\n}", 12);
    shell.controls.appendChild(makeField("CSS input", textarea));
    let output = "";

    shell.controls.appendChild(ctx.createActionButton({
      label: "Minify CSS",
      icon: "code",
      variant: "tonal",
      onClick: function () {
        if (!textarea.value.trim()) {
          output = "";
          updateResultBody(shell.resultBody, createResultHero("No output yet", "Paste CSS before minifying it."));
          ctx.setEmptyState(shell.resultPanel, "No CSS provided", "Add CSS before running the minifier.");
          return;
        }
        output = textarea.value
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*([{}:;,])\s*/g, "$1")
          .replace(/;}/g, "}")
          .trim();
        updateResultBody(shell.resultBody, [
          buildMetricGrid([
            { label: "Before", value: String(textarea.value.length), caption: "characters" },
            { label: "After", value: String(output.length), caption: "characters" }
          ]),
          createMonoBlock(output)
        ]);
        ctx.setSuccessState(shell.resultPanel, "CSS minified", "Comments and excess whitespace were removed.");
      }
    }));

    ctx.attachCopyAction(shell.actions, {
      getValue: function () {
        return output;
      }
    });
    updateResultBody(shell.resultBody, createResultHero("No output yet", "Paste CSS before minifying it."));
    ctx.setEmptyState(shell.resultPanel, "Minifier idle", "Provide CSS source to generate a minified version.");
  }

  const tools = [
    {
      id: "wordcounter",
      name: "Word Counter",
      category: "text",
      icon: "text_fields",
      description: "Count words, characters, lines, and reading time.",
      keywords: ["words", "characters", "lines", "reading time"],
      render: renderWordCounter
    },
    {
      id: "charcounter",
      name: "Character Counter",
      category: "text",
      icon: "title",
      description: "Track characters, whitespace-free characters, and line count.",
      keywords: ["characters", "length", "spaces", "lines"],
      render: renderCharCounter
    },
    {
      id: "caseconverter",
      name: "Case Converter",
      category: "text",
      icon: "format_size",
      description: "Convert text between common capitalization styles.",
      keywords: ["uppercase", "lowercase", "title case", "sentence case"],
      render: renderCaseConverter
    },
    {
      id: "textreverser",
      name: "Text Reverser",
      category: "text",
      icon: "swap_horiz",
      description: "Reverse a string character by character.",
      keywords: ["reverse", "mirror", "text"],
      render: renderTextReverser
    },
    {
      id: "passwordgen",
      name: "Password Generator",
      category: "utility",
      icon: "key",
      description: "Generate a stronger password with configurable character sets.",
      keywords: ["password", "security", "generator"],
      render: renderPasswordGenerator
    },
    {
      id: "loremipsum",
      name: "Lorem Ipsum",
      category: "text",
      icon: "notes",
      description: "Generate placeholder paragraphs for layouts and mocks.",
      keywords: ["placeholder", "copy", "paragraphs"],
      render: renderLoremGenerator
    },
    {
      id: "markdown",
      name: "Markdown Preview",
      category: "text",
      icon: "article",
      description: "Render Markdown with a live formatted preview.",
      keywords: ["markdown", "preview", "formatted"],
      render: renderMarkdownPreview
    },
    {
      id: "jsonformatter",
      name: "JSON Formatter",
      category: "text",
      icon: "data_object",
      description: "Prettify or minify JSON with validation feedback.",
      keywords: ["json", "format", "minify", "prettify"],
      render: renderJsonFormatter
    },
    {
      id: "regextester",
      name: "Regex Tester",
      category: "text",
      icon: "code",
      description: "Test a regex against sample text and inspect matches.",
      keywords: ["regex", "pattern", "matches"],
      render: renderRegexTester
    },
    {
      id: "diffchecker",
      name: "Diff Checker",
      category: "text",
      icon: "compare_arrows",
      description: "Compare two text blocks line by line.",
      keywords: ["diff", "compare", "lines"],
      render: renderDiffChecker
    },
    {
      id: "calculator",
      name: "Calculator",
      category: "calc",
      icon: "calculate",
      description: "Quick arithmetic with a cleaner keypad layout.",
      keywords: ["math", "arithmetic", "calculator"],
      render: renderCalculator
    },
    {
      id: "scientificcalc",
      name: "Scientific Calculator",
      category: "calc",
      icon: "functions",
      description: "Extended math functions for trigonometry, logs, and powers.",
      keywords: ["scientific", "trigonometry", "log", "sqrt"],
      render: renderScientificCalculator
    },
    {
      id: "tipcalc",
      name: "Tip Calculator",
      category: "calc",
      icon: "receipt_long",
      description: "Split a bill with tip across the group.",
      keywords: ["tip", "bill", "split"],
      render: renderTipCalculator
    },
    {
      id: "bmi",
      name: "BMI Calculator",
      category: "calc",
      icon: "monitor_weight",
      description: "Estimate BMI from height and weight.",
      keywords: ["bmi", "health", "weight", "height"],
      render: renderBmiCalculator
    },
    {
      id: "agecalc",
      name: "Age Calculator",
      category: "calc",
      icon: "cake",
      description: "Calculate age from a birth date.",
      keywords: ["age", "date", "birthday"],
      render: renderAgeCalculator
    },
    {
      id: "percentagecalc",
      name: "Percentage Calculator",
      category: "calc",
      icon: "percent",
      description: "Calculate a percentage of a base value.",
      keywords: ["percent", "percentage", "math"],
      render: renderPercentageCalculator
    },
    {
      id: "discountcalc",
      name: "Discount Calculator",
      category: "calc",
      icon: "sell",
      description: "Estimate discounted prices and savings.",
      keywords: ["discount", "sale", "price"],
      render: renderDiscountCalculator
    },
    {
      id: "currencyconverter",
      name: "Currency Converter",
      category: "calc",
      icon: "currency_exchange",
      description: "Convert between bundled static currency rates.",
      keywords: ["currency", "rates", "money"],
      render: renderCurrencyConverter
    },
    {
      id: "imageresize",
      name: "Image Resize",
      category: "image",
      icon: "photo_size_select_large",
      description: "Resize an image and export the new dimensions.",
      keywords: ["image", "resize", "dimensions"],
      render: renderImageResize
    },
    {
      id: "imagerotate",
      name: "Rotate and Flip",
      category: "image",
      icon: "crop_rotate",
      description: "Rotate an image and flip it horizontally or vertically.",
      keywords: ["image", "rotate", "flip"],
      render: renderImageRotate
    },
    {
      id: "imagecrop",
      name: "Image Crop",
      category: "image",
      icon: "crop",
      description: "Apply a quick centered crop to the current image.",
      keywords: ["image", "crop", "preview"],
      render: renderImageCrop
    },
    {
      id: "imagetobase64",
      name: "Image to Base64",
      category: "image",
      icon: "code",
      description: "Convert an image into a Base64 data URL.",
      keywords: ["image", "base64", "data url"],
      render: renderImageToBase64
    },
    {
      id: "qrcode",
      name: "QR Generator",
      category: "image",
      icon: "qr_code_2",
      description: "Generate a QR code from text or a URL.",
      keywords: ["qr", "code", "url"],
      render: renderQrGenerator
    },
    {
      id: "barcode",
      name: "Barcode Generator",
      category: "image",
      icon: "qr_code_scanner",
      description: "Build a CODE128 barcode with SVG export.",
      keywords: ["barcode", "svg", "code128"],
      render: renderBarcodeGenerator
    },
    {
      id: "colorconverter",
      name: "Color Converter",
      category: "image",
      icon: "palette",
      description: "Convert between HEX and RGB and preview the color.",
      keywords: ["color", "hex", "rgb"],
      render: renderColorConverter
    },
    {
      id: "unitconverter",
      name: "Unit Converter",
      category: "utility",
      icon: "straighten",
      description: "Convert between several common measurement pairs.",
      keywords: ["unit", "measurement", "conversion"],
      render: renderUnitConverter
    },
    {
      id: "base64",
      name: "Base64 Encode and Decode",
      category: "text",
      icon: "lock",
      description: "Convert between text and Base64 content.",
      keywords: ["base64", "encode", "decode"],
      render: renderBase64Tool
    },
    {
      id: "urlencoder",
      name: "URL Encoder",
      category: "text",
      icon: "link",
      description: "Encode or decode URL-safe strings.",
      keywords: ["url", "encode", "decode"],
      render: renderUrlEncoder
    },
    {
      id: "uuidgen",
      name: "UUID Generator",
      category: "utility",
      icon: "fingerprint",
      description: "Generate UUID v4 values using browser crypto.",
      keywords: ["uuid", "identifier", "crypto"],
      render: renderUuidGenerator
    },
    {
      id: "stopwatch",
      name: "Stopwatch",
      category: "utility",
      icon: "timer",
      description: "Track elapsed time with start, pause, and reset controls.",
      keywords: ["timer", "stopwatch", "elapsed"],
      render: renderStopwatch
    },
    {
      id: "hashgenerator",
      name: "Hash Generator",
      category: "utility",
      icon: "tag",
      description: "Generate MD5, SHA-1, or SHA-256 hashes locally.",
      keywords: ["hash", "md5", "sha-1", "sha-256"],
      render: renderHashGenerator
    },
    {
      id: "passwordstrength",
      name: "Password Strength",
      category: "utility",
      icon: "security",
      description: "Evaluate password strength and surface improvement tips.",
      keywords: ["password", "strength", "security"],
      render: renderPasswordStrength
    },
    {
      id: "morsetranslator",
      name: "Morse Code",
      category: "text",
      icon: "translate",
      description: "Translate between Morse code and plain text.",
      keywords: ["morse", "translate", "code"],
      render: renderMorseTranslator
    },
    {
      id: "binaryconverter",
      name: "Binary Converter",
      category: "text",
      icon: "memory",
      description: "Convert text to binary or decode binary back to text.",
      keywords: ["binary", "text", "converter"],
      render: renderBinaryConverter
    },
    {
      id: "csvtojson",
      name: "CSV to JSON",
      category: "text",
      icon: "table_chart",
      description: "Convert CSV rows into a formatted JSON array.",
      keywords: ["csv", "json", "table"],
      render: renderCsvToJson
    },
    {
      id: "jsontocsv",
      name: "JSON to CSV",
      category: "text",
      icon: "table_rows",
      description: "Convert a JSON array into CSV output.",
      keywords: ["json", "csv", "table"],
      render: renderJsonToCsv
    },
    {
      id: "timezoneconverter",
      name: "Time Zone Converter",
      category: "calc",
      icon: "schedule",
      description: "Convert a time between named source and target zones.",
      keywords: ["timezone", "time", "luxon", "zone"],
      render: renderTimezoneConverter
    },
    {
      id: "datasizeconverter",
      name: "Data Size Converter",
      category: "calc",
      icon: "storage",
      description: "Convert between bytes, KB, MB, GB, and TB.",
      keywords: ["data size", "bytes", "kb", "mb", "gb"],
      render: renderDataSizeConverter
    },
    {
      id: "charmap",
      name: "ASCII Table",
      category: "utility",
      icon: "grid_on",
      description: "Browse the first 128 ASCII character codes.",
      keywords: ["ascii", "character map", "reference"],
      render: renderCharMap
    },
    {
      id: "jwtdecoder",
      name: "JWT Decoder",
      category: "utility",
      icon: "key",
      description: "Decode the header and payload from a JWT locally.",
      keywords: ["jwt", "token", "decode"],
      render: renderJwtDecoder
    },
    {
      id: "randomnum",
      name: "Random Number",
      category: "calc",
      icon: "casino",
      description: "Generate a random integer inside a chosen range.",
      keywords: ["random", "number", "range"],
      render: renderRandomNumber
    },
    {
      id: "emojitranslator",
      name: "Emoji Translator",
      category: "utility",
      icon: "mood",
      description: "Swap supported text markers with emoji and back again.",
      keywords: ["emoji", "translate", "tokens"],
      render: renderEmojiTranslator
    },
    {
      id: "cssminifier",
      name: "CSS Minifier",
      category: "text",
      icon: "code",
      description: "Compress CSS by removing comments and extra whitespace.",
      keywords: ["css", "minify", "compress"],
      render: renderCssMinifier
    }
  ];

  window.ToolsSuperAppData = {
    categories: categories,
    featuredIds: featuredIds,
    tools: tools
  };
})();
