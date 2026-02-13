# Invoice Currency Symbol — Implementation Notes

This document explains how the invoice PDF was updated to render the Indian Rupee symbol (₹) instead of a plain `1` or fallback text.

Summary
- File changed: `backend/routes/orders.js`
- Approach: use a font that contains the rupee glyph when available; otherwise fall back to `Rs.` prefix.

What was added
- Import `fs` and a small font-detection helper that checks common Windows font paths (e.g. `C:\Windows\Fonts\segoeui.ttf`, `arial.ttf`, `calibri.ttf`, etc.).
- `currencySymbol` is set to `₹`.
- `writeCurrency(value, x, y)` helper: attempts to set `doc.font(currencyFontPath)` and write `₹<amount>`; if the font isn't available or rendering fails, it writes `Rs.<amount>` as a fallback.
- Replaced direct amount text calls in the amounts section (Subtotal, Tax, Shipping, Total) with `writeCurrency(...)` so the symbol is used there.

Why this was necessary
- PDF rendering depends on the font containing the glyph. The default PDFKit fonts may not include the rupee glyph on all systems, which caused the wrong character to appear. Selecting a local font that includes the glyph ensures correct rendering on that machine.

How it works (quick)
1. On invoice generation, the code runs a small search for common Windows TTF files using `fs.existsSync()`.
2. If a font file is found, `doc.font(<path>)` is used to draw the amount string `₹<amount>`.
3. The document then switches back to `Helvetica` for other text.
4. If no suitable font is found or writing with the font throws, the helper writes `Rs.<amount>` instead.

How to test locally
1. Start the backend server (from project root):

```bash
cd backend
npm install   # if needed
node server.js
```

2. In the frontend or browser, download an invoice for an order by opening the invoice endpoint, for example:

```
GET http://localhost:3000/api/orders/invoice/<orderId>
```

3. Open the downloaded PDF and verify:
- If your machine has one of the candidate fonts, amounts should show `₹` correctly.
- If not, amounts will appear as `Rs.<amount>`.

Optional improvements
- Ship and register a specific TTF/OTF with the project (e.g., `fonts/NotoSans-Regular.ttf`) and use that path instead of relying on system fonts. This gives consistent rendering across servers.
- Use a library to embed fonts formally with PDFKit or bundle a small font in the repo.

If you want, I can: add a bundled font to the repo for consistent server-side rendering, or update the search paths for Linux/macOS servers. Which would you prefer?
