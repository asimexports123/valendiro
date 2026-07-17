const fs = require("fs");
const path = "temp/health-insurance-article.md";
if (!fs.existsSync(path)) {
  console.error("article missing");
  process.exit(1);
}
const text = fs.readFileSync(path, "utf8");
const paras = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
(async () => {
  const mod = await import("../services/discovery/brainCompose.js");
  const isEditoriallySound = mod.isEditoriallySound;
  let pass = 0;
  for (const p of paras) {
    try {
      if (isEditoriallySound(p, "Health Insurance")) pass++;
    } catch (e) {
      // ignore
    }
  }
  console.log(JSON.stringify({ paras: paras.length, passed: pass, ratio: (pass / paras.length).toFixed(2) }));
})();

