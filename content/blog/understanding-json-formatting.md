JSON is easier to inspect when its structure is visible. Formatting adds indentation and line breaks so you can follow objects, arrays, and values without rewriting the data by hand.

This guide walks through a small example using the [JSON Formatter](/tools/json-formatter?mode=format), then explains what to check before copying the result into an application.

## Format your first document

1. Open the formatter and paste a JSON document.
2. Choose your preferred indentation.
3. Run **Format & validate JSON**.
4. Read the output and copy or download it when you are satisfied.

Try this compact input:

```json
{"customer":{"name":"Ada","active":true},"items":[{"sku":"A-12","quantity":2}]}
```

The formatted result makes the nested customer object and the items array easier to distinguish. Keep a copy of your original input while investigating an unfamiliar response.

## Understand validation errors

JSON has stricter rules than a JavaScript object literal. Property names and strings need double quotes. Comments, trailing commas, `undefined`, and bare `NaN` are not valid JSON.

| Problem | Example | What to check |
| --- | --- | --- |
| Unquoted property | `{name: "Ada"}` | Put double quotes around the property |
| Trailing comma | `{"active": true,}` | Remove the comma after the final value |
| Broken string | `{"name": "Ada}` | Close the string before the object |

Smart Fix may suggest a repair, but an ambiguous input can have several interpretations. Review the repaired values before accepting them.

## Formatting, minifying, and analyzing

**Formatting** helps people read the document. **Minifying** removes unnecessary whitespace for a more compact representation. Neither operation should change text inside strings.

The analysis view can highlight naming patterns and array consistency. These are style observations, not proof that a response meets your application's schema or business rules.

Large numbers deserve a separate check. If a long identifier is represented as a number, avoid moving it through application code that rounds numeric values. An identifier encoded as a string keeps its digits explicit.

## Check the result before sharing

Look for access tokens, email addresses, customer details, and other information you did not intend to share. A nicely formatted response can still contain sensitive data.

Need to inspect an encoded payload next? The [Base64 tool](/tools/base64-encoder) can help with encoding and decoding. Base64 does not encrypt information.
