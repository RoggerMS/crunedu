const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "UL", "OL", "LI",
  "DIV", "SPAN", "SUP", "SUB", "CODE", "PRE", "BLOCKQUOTE",
]);

const DANGEROUS_TAGS = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON",
  "IMG", "A", "LINK", "META", "SVG", "MATH",
]);

export function looksLikeHtml(content: string): boolean {
  return /<\/?(p|b|strong|i|em|u|s|strike|ul|ol|li|div|br|span|sup|sub|code|pre|blockquote)\b/i.test(content);
}

export function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  return (template.content.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/on\w+="[^"]*"/gi, "").replace(/on\w+='[^']*'/gi, "");
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  const removable: Element[] = [];
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT, null);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName;
      if (DANGEROUS_TAGS.has(tag) || !ALLOWED_TAGS.has(tag)) {
        removable.push(element);
      } else {
        Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));
      }
    }
    node = walker.nextNode();
  }
  removable.forEach((element) => {
    const parent = element.parentNode;
    if (parent) {
      const text = element.textContent ?? "";
      parent.replaceChild(document.createTextNode(text), element);
    }
  });
  return template.innerHTML.trim();
}

export function escapePlainText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}
