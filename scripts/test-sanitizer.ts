const facts = [
  "Pandas read_csv reads a CSV file into a DataFrame.",
  "Pandas groupby groups data by one or more columns for aggregate operations.",
  "Pandas merge combines DataFrames on common columns similar to Structured Query Language joins.",
  "Pandas dropna removes rows with missing values.",
  "Pandas fillna replaces missing values with specified values.",
  "Pandas apply applies a function along an axis of the DataFrame.",
  "Pandas loc selects rows and columns by label, while iloc selects by integer position.",
  "Pandas provides two primary data structures: Series for one-dimensional data",
  "Pandas provides DataFrame for two-dimensional data",
  "Pandas supports writing to CSV",
  "Pandas supports Excel",
  "Pandas was created in 2008",
  "Pandas was created by Wes McKinney and first released",
  "Agile Development Overview.",
  "User stories describe features I want to",
  "Scrum sprint planning determines what work will be accomplished in the sprint.",
  "Story points estimate the relative effort of user stories.",
  "Velocity measures how many story points a team completes per sprint.",
];

const VERB_RE = /\b(is|are|was|were|has|have|had|provides?|uses?|allows?|enables?|helps?|creates?|defines?|describes?|represents?|supports?|contains?|consists?|gives?|makes?|can|will|does?|should|must|refers?|reads?|removes?|replaces?|applies?|selects?|groups?|combines?|measures?|estimates?|determines?|demonstrates?|reflects?|deploys?|describes?)\b/i;

for (const f of facts) {
  const s = f.trim();
  const words = s.split(/\s+/).length;
  const hasVerb = VERB_RE.test(s);
  const keep = words >= 8 && hasVerb;
  console.log(`${keep ? "KEEP" : "DROP"} ${String(words).padStart(3)}w  verb=${hasVerb}  ${s.slice(0, 70)}`);
}
