# KI-8 Owner Action: Add Copyright Notice to LICENSE

Your repository declares `"license": "MIT"` and `"private": false` in package.json, which signals to package managers and downstream users that your code is publicly available under the MIT license. However, no LICENSE file currently exists in the repository. This creates a legal gap: anyone installing or using your code cannot verify who holds the copyright or confirm the licensing terms in writing.

## What You Must Supply

Create a file named `LICENSE` at the repository root (the same directory level as package.json, bin/, src/, and README.md).

Add exactly this line at the very top of the file:

```
Copyright (c) <year> <legal holder>
```

Then follow it with the standard MIT license body. You can find the canonical text at https://opensource.org/licenses/MIT.

You must decide and provide:
- `<year>`: the year or year range of original copyright (e.g., 2024 or 2024-2026)
- `<legal holder>`: the name of the person or organization claiming the copyright (e.g., "Jane Doe", "Acme Corporation", or "The Contributors")

No agent can make these choices for you. These decisions are yours alone as the repository owner.

## What Stays Broken Until Then

Without this copyright line and license text in the LICENSE file, the repository remains in an inconsistent and legally ambiguous state:
- package.json publicly declares MIT licensing but ships no license text
- Any downstream user who installs this package cannot verify the copyright holder's identity
- Distribution violates the open-source principle: the license terms must accompany the code

Once you supply the copyright line and add the complete MIT license body to the LICENSE file, this inconsistency is resolved and the repository is properly licensed.
