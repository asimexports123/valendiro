import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function improveGitFundamentals() {
  console.log("Improving Git Version Control knowledge package...\n");

  const improvements = {
    facts: [
      // Core Concepts
      {
        statement: "Git is a distributed version control system created by Linus Torvalds in 2005 for Linux kernel development.",
        fact_type: "historical",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "version-control", "linus-torvalds"],
      },
      {
        statement: "Git tracks changes to source code over time and enables collaboration among multiple developers.",
        fact_type: "definition",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "version-control", "collaboration"],
      },
      {
        statement: "Git is distributed, meaning every developer has a complete copy of the repository history on their local machine.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "distributed", "repositories"],
      },
      {
        statement: "Git uses a staging area to prepare changes before committing them to the repository history.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "staging-area", "workflow"],
      },
      
      // Installation and Setup
      {
        statement: "Git can be installed from git-scm.com for Windows, macOS, and Linux operating systems.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "installation", "setup"],
      },
      {
        statement: "Git requires initial configuration with user name and email using git config commands.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "configuration", "setup"],
      },
      {
        statement: "Git config --global user.name and git config --global user.email set the identity for commits.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "configuration", "identity"],
      },
      
      // Basic Commands
      {
        statement: "Git init initializes a new Git repository in the current directory.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "init", "repositories"],
      },
      {
        statement: "Git clone creates a copy of an existing repository from a remote URL.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "clone", "repositories"],
      },
      {
        statement: "Git status shows the working tree status and staged changes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "status", "workflow"],
      },
      {
        statement: "Git add stages files for the next commit.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "add", "staging"],
      },
      {
        statement: "Git commit saves staged changes with a descriptive message to the repository history.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "commit", "history"],
      },
      {
        statement: "Git log displays the commit history with messages and metadata.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "log", "history"],
      },
      
      // Branching and Merging
      {
        statement: "Git branch creates, lists, or deletes branches in the repository.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "branch", "branches"],
      },
      {
        statement: "Git checkout switches branches or restores working tree files.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "checkout", "branches"],
      },
      {
        statement: "Git switch is a modern alternative to checkout for switching branches.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "switch", "branches"],
      },
      {
        statement: "Git merge combines changes from different branches into the current branch.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "merge", "branches"],
      },
      {
        statement: "Git merge --no-ff creates a merge commit even when fast-forward is possible.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "merge", "fast-forward"],
      },
      
      // Remote Repositories
      {
        statement: "Git remote manages connections to remote repositories.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "remote", "repositories"],
      },
      {
        statement: "Git push uploads local commits to a remote repository.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "push", "remote"],
      },
      {
        statement: "Git pull fetches and merges changes from a remote repository into the current branch.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "pull", "remote"],
      },
      {
        statement: "Git fetch downloads objects and refs from a remote repository without merging.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "fetch", "remote"],
      },
      
      // Undo Operations
      {
        statement: "Git reset changes the current HEAD to a specified state, optionally modifying the index and working tree.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "reset", "undo"],
      },
      {
        statement: "Git revert creates a new commit that undoes changes from a previous commit.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "revert", "undo"],
      },
      {
        statement: "Git checkout -- discards changes in the working directory for specified files.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "checkout", "discard"],
      },
      {
        statement: "Git restore is a modern alternative for discarding changes and restoring files.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "restore", "discard"],
      },
      
      // Git Ignore
      {
        statement: "Git .gitignore files specify intentionally untracked files that Git should ignore.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "gitignore", "configuration"],
      },
      {
        statement: "Git ignore patterns use glob syntax to match files and directories.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "gitignore", "patterns"],
      },
      
      // Collaborative Workflows
      {
        statement: "Git supports feature branch workflow where developers create branches for new features.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "workflows", "feature-branches"],
      },
      {
        statement: "Git pull requests or merge requests enable code review before merging changes.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "pull-requests", "collaboration"],
      },
      {
        statement: "Git conflicts occur when conflicting changes are made to the same lines in different branches.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "conflicts", "merging"],
      },
      
      // Stashing
      {
        statement: "Git stash temporarily saves changes that are not ready to be committed.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "stash", "workflow"],
      },
      {
        statement: "Git stash pop applies stashed changes and removes them from the stash list.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "universal",
        tags: ["git", "stash", "workflow"],
      },
      
      // Tagging
      {
        statement: "Git tag creates named references to specific commits, often for releases.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "tags", "releases"],
      },
      
      // Best Practices
      {
        statement: "Git commit messages should be clear, concise, and follow conventional commit format.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "commits", "best-practices"],
      },
      {
        statement: "Git commits should be atomic, focusing on a single logical change.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "commits", "best-practices"],
      },
      {
        statement: "Git branching should be used for features, bug fixes, and releases to maintain clean history.",
        fact_type: "instruction",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "branches", "best-practices"],
      },
      
      // Platform Integration
      {
        statement: "GitHub provides hosting for Git repositories with additional collaboration features.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "github", "hosting"],
      },
      {
        statement: "GitLab and Bitbucket are alternative platforms for Git repository hosting and collaboration.",
        fact_type: "property",
        confidence: "high",
        domain: "Software Engineering",
        scope: "contextual",
        tags: ["git", "gitlab", "bitbucket", "hosting"],
      },
    ],
  };

  try {
    const response = await fetch(`${BASE_URL}/api/admin/improve-knowledge-package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_id: "ff96a9c0-57a3-4df2-86b5-ef3357c954a1",
        improvements,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== IMPROVEMENT COMPLETE ===\n");
    console.log(`Facts added: ${data.facts_added}`);
    console.log(`Message: ${data.message}`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

improveGitFundamentals();
