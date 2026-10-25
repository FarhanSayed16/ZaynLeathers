const ADMIN_NOTE = /you can edit photos|wordpress/i;
const SPEC_LINE = /^(sku|colour|color|material|available sizes)\s*:/i;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

/**
 * Turn a WooCommerce HTML description into readable blocks.
 * Drops the import note meant for the shop admin, and spec lines that
 * are already shown next to the product.
 */
export function productCopyBlocks(html, productName = "") {
  const raw = String(html || "").trim();
  if (!raw) return [];

  const title = cleanText(productName).replace(/\.$/, "").toLowerCase();
  const blocks = [];

  const pushParagraph = (text) => {
    const clean = cleanText(text).replace(/\s+\./g, ".");
    if (!clean || ADMIN_NOTE.test(clean)) return;
    const comparable = clean.replace(/\.$/, "").toLowerCase();
    if (title && comparable === title) return;
    blocks.push({ type: "p", text: clean });
  };

  if (typeof DOMParser === "undefined") {
    pushParagraph(raw.replace(/<[^>]+>/g, " "));
    return blocks;
  }

  const doc = new DOMParser().parseFromString(raw, "text/html");
  for (const node of doc.body.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      pushParagraph(node.textContent);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = node.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const items = [...node.querySelectorAll("li")]
        .map((item) => cleanText(item.textContent))
        .filter((item) => item && !SPEC_LINE.test(item) && !ADMIN_NOTE.test(item));
      if (items.length) blocks.push({ type: "ul", items });
      continue;
    }
    pushParagraph(node.textContent);
  }

  return blocks;
}

export function plainProductText(html, productName = "") {
  return productCopyBlocks(html, productName)
    .map((block) => (block.type === "ul" ? block.items.join(". ") : block.text))
    .join(" ");
}
