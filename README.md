# Fairness Gift

An offline, static web tool. Open `index.html` directly—no installation or internet connection is required, except when opening the Google Form.

## Workflow

1. Enter the ticket, account, highest purchase among the latest five, emotion, and gift-frequency data.
2. Select **Calculate & Generate Handling Plan**.
3. Follow the displayed issuance route, offer, or escalation instructions and copy the required templates.
4. After issuing the gift, the issuer must submit the Google Form immediately.

## Rules

- Paid Level is determined automatically from Total Purchase.
- The 10% calculation keeps up to two decimal places. The SOP does not define integer rounding, so the tool does not round up automatically.
- The tool does not save or upload any entered data.
- This tool supports SOP execution. Always verify source data before issuance.

## Local Test

```bash
node test.js
```
