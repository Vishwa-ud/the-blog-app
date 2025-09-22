import sanitizeHtml from "sanitize-html";

export function sanitizeInput(input:unknown):string | unknown{
    if (typeof input !== "string") return input;

    return sanitizeHtml(input, {
        allowedTags: ["b", "i", "em", "strong", "a", "p", "ul", "li", "ol", "br"],
        allowedAttributes: {
            a: ["href", "name", "target"],
        },
        allowedIframeHostnames: [],
    })
}