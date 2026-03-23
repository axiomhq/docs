# OpenAPI source specs

These are the source-of-truth OpenAPI specification files. Edit these files, not the ones in `restapi/versions/`.

After editing, run the sanitize script to regenerate the output:

```
node scripts/sanitize-openapi.js
```

The script strips fields marked with `x-hide-in-docs: true` and writes sanitized output to `restapi/versions/`.

## Hiding fields from docs

Add `"x-hide-in-docs": true` to any parameter, schema property, or header to exclude it from the rendered documentation.

```json
{
  "properties": {
    "internal_id": {
      "type": "string",
      "x-hide-in-docs": true
    }
  }
}
```

Supported locations:
- Schema properties (in request bodies, responses, and component schemas)
- Parameters (query, path, header)
- Response headers
