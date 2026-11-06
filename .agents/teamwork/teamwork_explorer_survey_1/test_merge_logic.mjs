function parseJsonc(text) {
  if (!text.trim()) return {};
  const noBlockComments = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLineComments = noBlockComments.split("\n").map((line) => {
    let out = "", inStr = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inStr) {
        out += c;
        if (c === "\\") { out += line[i + 1] ?? ""; i++; }
        else if (c === '"') inStr = false;
      } else if (c === '"') { inStr = true; out += c; }
      else if (c === "/" && line[i + 1] === "/") break;
      else out += c;
    }
    return out;
  }).join("\n");
  const noTrailing = noLineComments.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(noTrailing);
}

// Test cases
console.log("Test 1 - empty string:", parseJsonc(""));

const test2 = `{
  // line comment
  "name": "test",
  /* block comment */
  "nested": {
    "url": "http://example.com/foo//bar",
    "trailingComma": true,
  },
}`;
console.log("Test 2 - comments & trailing comma:", parseJsonc(test2));

const testReal = `{
  "$schema": "https://opencode.ai/config.json",
  "permission": "allow",
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://127.0.0.1:9223",
        "--no-category-emulation",
        "--no-category-performance",
        "--no-category-network",
        "--no-category-memory",
        "--no-usage-statistics"
      ]
    },
    "cloudflare": { "type": "remote", "url": "https://mcp.cloudflare.com/mcp", "enabled": true, "oauth": {} }
  }
}`;
console.log("Test 3 - real opencode.jsonc:", parseJsonc(testReal));
