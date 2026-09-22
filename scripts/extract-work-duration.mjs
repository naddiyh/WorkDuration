import fs from "node:fs";
import { PDFParse } from "pdf-parse";

const file = process.argv[2];
if (!file) throw new Error("Pass the PDF path as the first argument.");

const parser = new PDFParse({ data: fs.readFileSync(file) });
const result = await parser.getText();
console.log(result.text);
await parser.destroy();
