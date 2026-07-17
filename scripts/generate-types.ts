import messages from "../src/messages.toml";

function typeOf(value: unknown, indent = ""): string {
  if (Array.isArray(value)) return `${typeOf(value[0], indent)}[]`;
  if (value && typeof value === "object") {
    const next = `${indent}  `;
    const properties = Object.entries(value)
      .map(([key, value]) => `${next}readonly ${JSON.stringify(key)}: ${typeOf(value, next)};`)
      .join("\n");
    return `{\n${properties}\n${indent}}`;
  }
  return typeof value;
}

await Bun.write(
  "src/messages.toml.d.ts",
  `declare const messages: ${typeOf(messages)};\n\nexport default messages;\n`,
);
