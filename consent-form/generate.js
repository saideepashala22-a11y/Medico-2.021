import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const outDir = path.join("output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const fileUrl = "file://" + path.resolve("index.html");

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox"]
});
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle0" });

// Ensure fonts render before printing
await page.evaluateHandle("document.fonts.ready");

await page.pdf({
  path: path.join(outDir, "consent-form.pdf"),
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
  preferCSSPageSize: true
});

await browser.close();
console.log("✅ PDF saved to output/consent-form.pdf");