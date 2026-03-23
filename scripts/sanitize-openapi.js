// Sanitize OpenAPI specs by removing fields marked with x-hide-in-docs: true.
//
// Reads from restapi/source/*.json, writes to restapi/versions/*.json.
// Handles parameters, schema properties, and headers.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "restapi", "source");
const OUTPUT_DIR = path.join(ROOT, "restapi", "versions");

const MARKER = "x-hide-in-docs";
const REMOVE = Symbol("remove");

function validateNoHiddenReusableComponents(spec, file) {
  const components = spec.components || {};

  for (const section of ["parameters", "headers"]) {
    const items = components[section];
    if (!items || typeof items !== "object") continue;

    for (const [name, value] of Object.entries(items)) {
      if (value && value[MARKER] === true) {
        throw new Error(
          `${file}: ${MARKER} is not supported on reusable components.${section}.${name}. ` +
            `Inline the parameter/header in the operation instead.`
        );
      }
    }
  }
}

function sanitize(node, ctx = {}) {
  if (Array.isArray(node)) {
    return node
      .map((item) => sanitize(item, ctx))
      .filter((item) => item !== REMOVE);
  }

  if (!node || typeof node !== "object") return node;

  // Only remove nodes in relevant contexts
  if (node[MARKER] === true) {
    if (ctx.removable) {
      return REMOVE;
    }
    console.warn(
      `Warning: ${MARKER} found in unsupported location (not a property, parameter, or header). ` +
        `The field will not be hidden.`
    );
  }

  // First pass: process properties to know which were removed
  const removedProperties = new Set();
  let processedProperties = undefined;

  if (
    node.properties &&
    typeof node.properties === "object" &&
    !Array.isArray(node.properties)
  ) {
    processedProperties = {};
    for (const [propName, propSchema] of Object.entries(node.properties)) {
      const result = sanitize(propSchema, { removable: true });
      if (result === REMOVE) {
        removedProperties.add(propName);
      } else {
        processedProperties[propName] = result;
      }
    }
  }

  // Second pass: build output preserving original key order
  const out = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === MARKER) continue;

    if (key === "properties" && processedProperties !== undefined) {
      out[key] = processedProperties;
      continue;
    }

    if (key === "required" && Array.isArray(value)) {
      const filtered = value.filter(
        (name) => !removedProperties.has(name)
      );
      if (filtered.length > 0) {
        out[key] = filtered;
      }
      continue;
    }

    if (key === "parameters") {
      if (Array.isArray(value)) {
        out[key] = value
          .map((item) => sanitize(item, { removable: true }))
          .filter((item) => item !== REMOVE);
      } else if (value && typeof value === "object") {
        const params = {};
        for (const [name, param] of Object.entries(value)) {
          const result = sanitize(param, { removable: true });
          if (result !== REMOVE) params[name] = result;
        }
        out[key] = params;
      }
      continue;
    }

    if (
      key === "headers" &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const headers = {};
      for (const [headerName, header] of Object.entries(value)) {
        const result = sanitize(header, { removable: true });
        if (result !== REMOVE) headers[headerName] = result;
      }
      out[key] = headers;
      continue;
    }

    out[key] = sanitize(value);
  }

  return out;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.error("No JSON files found in source directory.");
    process.exit(1);
  }

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    const raw = fs.readFileSync(sourcePath, "utf-8");
    const spec = JSON.parse(raw);

    validateNoHiddenReusableComponents(spec, file);

    const sanitized = sanitize(spec);

    fs.writeFileSync(outputPath, JSON.stringify(sanitized, null, 2) + "\n");
    console.log(`Sanitized: ${file}`);
  }

  // Remove stale files in output that no longer exist in source
  const outputFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".json"));
  for (const file of outputFiles) {
    if (!files.includes(file)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
      console.log(`Removed stale: ${file}`);
    }
  }
}

main();
