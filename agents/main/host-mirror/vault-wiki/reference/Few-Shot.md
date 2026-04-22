---
title: Few-Shot Prompt Framework
type: knowledge
tags:
  - prompt-engineering
  - framework
  - few-shot
  - examples
source: 'https://github.com/dpintoryan/Promptly'
use_for:
  - style-matching
  - format-copying
  - tone-replication
  - pattern-following
summary: >-
  Example-based framework. Show 2-3 examples of desired input→output, then
  provide new input.
created: '2026-03-18'
updated: '2026-03-18'
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
wiki_id: reference/Few-Shot
imported_from: vault/Reference/Few-Shot.md
imported_at: '2026-04-04T00:23:56.921Z'
---

# Few-Shot Framework

**Best for:** Copying a style, tone, format, or pattern. Transformations where you have examples.

## Template

```
Here are examples of [task description]:

Example 1:
Input: [input 1]
Output: [output 1]

Example 2:
Input: [input 2]
Output: [output 2]

Example 3 (optional):
Input: [input 3]
Output: [output 3]

Now apply the same pattern to:
Input: [your actual input]
Output:
```

## Key Principles
- **2-3 examples is the sweet spot** — 1 is too few, 5+ adds noise
- **Examples should be diverse** — cover edge cases you care about
- **Format must be consistent** — inconsistent examples confuse the model
- **Label your examples** — "Example 1/2/3" or "Input/Output" markers help

## Example

```
Here are examples of converting technical errors into user-friendly messages:

Example 1:
Input: ConnectionError: Failed to establish a new connection: [Errno 111] Connection refused
Output: We couldn't connect to the server. Check your internet connection and try again.

Example 2:
Input: ValueError: invalid literal for int() with base 10: 'abc'
Output: The value you entered isn't a valid number. Please enter digits only.

Example 3:
Input: PermissionError: [Errno 13] Permission denied: '/var/log/app.log'
Output: The app doesn't have permission to access that file. Contact your administrator.

Now apply the same pattern to:
Input: TimeoutError: The read operation timed out after 30 seconds
Output:
```

## When to Switch Frameworks
- Reasoning required → [[Chain-of-Thought]]
- Structured task → [[TCRTE]]

## Related

- [[GitHub]]
- [[Intel]]
- [[-]]
- [[Favorites]]
