import fs from "node:fs";

const text = fs.readFileSync("C:/Users/Vaibhav/.gemini/antigravity-cli/brain/e727119e-f1fe-4ac1-8c6b-9ec88b40ba57/.system_generated/steps/119/content.md", "utf8");
// strip prefix markdown if any
const jsonStart = text.indexOf("{");
const json = JSON.parse(text.slice(jsonStart));

console.log("Root properties keys:", Object.keys(json.properties));
console.log("Has 'permission':", "permission" in json.properties);
console.log("Has 'permissions':", "permissions" in json.properties);

if ("permission" in json.properties) {
  console.log("permission schema:", JSON.stringify(json.properties.permission, null, 2));
}
if ("permissions" in json.properties) {
  console.log("permissions schema:", JSON.stringify(json.properties.permissions, null, 2));
}

if (json.$defs && json.$defs["Permission.Ruleset"]) {
  console.log("Permission.Ruleset:", JSON.stringify(json.$defs["Permission.Ruleset"], null, 2));
}
