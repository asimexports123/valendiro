import { isCoherentDiscourse, auditParagraphQuality } from "../services/discovery/paragraphQualityGate";

const open =
  "Artificial Intelligence is the capability of computational systems to perform tasks often linked to human intelligence, such as learning, reasoning. It matters because knowing what it is—and is not—changes real decisions. You encounter it in everyday products, tools, and decisions—often before the formal name sticks.";
console.log("coherent", isCoherentDiscourse(open));
console.log(auditParagraphQuality(open));

const open2 =
  "HTML is the most basic building block of the Web. It matters because knowing what it is—and is not—changes real decisions. You encounter it in everyday products, tools, and decisions—often before the formal name sticks.";
console.log("html", isCoherentDiscourse(open2), auditParagraphQuality(open2));

// truncated first sentence like fuel often produces
const open3 =
  "Artificial Intelligence is the capability of computational systems to perform tasks often linked to human intelligence, such as learning, reasoning. That sentence is the spine of this guide.";
console.log("old", isCoherentDiscourse(open3), auditParagraphQuality(open3));
