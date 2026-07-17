import { brainMarkdownToDocumentTree } from "../services/discovery/brainMarkdownRender";
import { serializeCanonicalProjection } from "../services/renderer/serializers/canonical";

const md = `# What Is Artificial Intelligence?

Artificial Intelligence is best understood through Learning and Reasoning.

## What Is Artificial Intelligence?

At its core, this field is tied to Engineering and Mathematics.

## Key Concepts

Stakeholders expect AI to reflect pattern recognition.
`;

const tree = brainMarkdownToDocumentTree(md);
console.log(
  "nodes",
  tree.length,
  tree.map((n) =>
    n.type === "heading"
      ? `heading:${(n as { text?: string }).text}`
      : n.type === "paragraph"
        ? `paragraph:${((n as { children?: Array<{ value?: string }> }).children?.[0]?.value ?? "").slice(0, 40)}`
        : n.type
  )
);
console.log("serialized", serializeCanonicalProjection(tree));
