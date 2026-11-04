// Fills [data-copy] text and [data-copy-list] templates from assets/data/copy.json (*x* = accent, \n = <br>); window.siteCopy resolves when done.

const COPY_URL = "assets/data/copy.json";

function copyLookup(copy, path) {
  return path.split(".").reduce((node, key) => {
    return node == null ? undefined : node[key];
  }, copy);
}

// Builds nodes instead of using innerHTML so a stray "<" in the JSON stays text.
function fillText(el, text) {
  el.replaceChildren();

  String(text).split("\n").forEach((line, i) => {
    if (i > 0) {
      el.appendChild(document.createElement("br"));
    }

    // Odd pieces sit between asterisks.
    line.split("*").forEach((piece, j) => {
      if (!piece) {
        return;
      }
      if (j % 2 === 1) {
        const accent = document.createElement("span");
        accent.className = "accent";
        accent.textContent = piece;
        el.appendChild(accent);
      } else {
        el.appendChild(document.createTextNode(piece));
      }
    });
  });
}

function fillItem(fragment, item) {
  const fields = typeof item === "string" ? { text: item } : item;

  fragment.querySelectorAll("[data-field]").forEach((el) => {
    fillText(el, fields[el.dataset.field] || "");
  });

  fragment.querySelectorAll("[data-field-href]").forEach((el) => {
    const href = fields[el.dataset.fieldHref];
    if (href) {
      el.href = href;
    } else {
      el.remove();
    }
  });

  fragment.querySelectorAll("[data-field-media]").forEach((el) => {
    el.dataset.media = fields[el.dataset.fieldMedia] || el.dataset.media || "";
  });

  fragment.querySelectorAll("[data-field-alt]").forEach((el) => {
    el.alt = fields[el.dataset.fieldAlt] || "";
  });
}

function renderList(host, items) {
  const template = host.querySelector("template");
  if (!template) {
    console.warn("data-copy-list needs a <template> inside", host);
    return;
  }

  items.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    fillItem(fragment, item);
    host.appendChild(fragment);
  });
}

window.siteCopy = fetch(COPY_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(COPY_URL + " returned " + response.status);
    }
    return response.json();
  })
  .then((copy) => {
    document.querySelectorAll("[data-copy]").forEach((el) => {
      const text = copyLookup(copy, el.dataset.copy);
      if (typeof text === "string") {
        fillText(el, text);
      } else {
        console.warn("copy.json has no text at", el.dataset.copy);
      }
    });

    document.querySelectorAll("[data-copy-list]").forEach((host) => {
      const items = copyLookup(copy, host.dataset.copyList);
      if (Array.isArray(items)) {
        renderList(host, items);
      } else {
        console.warn("copy.json has no list at", host.dataset.copyList);
      }
    });

    return copy;
  })
  .catch((error) => {
    console.error("Could not load page text:", error);
    return null;
  });
