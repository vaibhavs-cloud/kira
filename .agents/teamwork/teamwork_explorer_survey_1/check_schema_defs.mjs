import fs from "node:fs";

const text = fs.readFileSync("C:/Users/Vaibhav/.gemini/antigravity-cli/brain/e727119e-f1fe-4ac1-8c6b-9ec88b40ba57/.system_generated/steps/119/content.md", "utf8");
const jsonStart = text.indexOf("{");
const json = JSON.parse(text.slice(jsonStart));

console.log("PermissionConfig:", JSON.stringify(json.$defs["PermissionConfig"], null, 2));
console.log("Permission.Rule:", JSON.stringify(json.$defs["Permission.Rule"], null, 2));
console.log("Agent schema:", JSON.stringify(json.$defs["Config.AgentEncoded"], null, 2));
