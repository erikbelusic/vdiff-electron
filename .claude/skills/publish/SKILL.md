---
name: publish
description: Publish a new release of vdiff-electron
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash(npm:*, git:*, gh:*, GITHUB_TOKEN=*), Read
---

# Publish a new release of vdiff-electron

Follow these steps in order to publish a new release.

## 1. Determine version bump

- Read `package.json` to get the current version
- Run `git fetch --tags`
- Run `git log v{current_version}..HEAD --oneline` to show commits since last release
- Display the commits to the user
- Analyze the changes and suggest a bump type:
  - **patch** for bug fixes, small tweaks, dependency updates
  - **minor** for new features, enhancements
  - **major** for breaking changes
- Ask the user to confirm or override (major / minor / patch)

## 2. Bump version & commit

- Run `npm version {type} --no-git-tag-version` to update `package.json` and `package-lock.json`
- Read `package.json` to get the new version number
- Stage `package.json` and `package-lock.json`
- Commit with message `v{new_version}`

## 3. Push & build

- Push the commit: `git push`
- Run the publish command: `GITHUB_TOKEN=$(gh auth token) npm run publish`
  - This builds the app via Electron Forge and creates a **draft** GitHub release with the tag `v{new_version}` and DMG/zip artifacts attached

## 4. Finalize release

- Generate a changelog by summarizing the commits between the previous and new tag
- Format the changelog using the following sections. Only include sections that apply — omit any section with no entries:

```
## What's New
- {new features}

## What's Changed
- {tweaks to existing features}

## Bug Fixes
- {bugs addressed}

## Other
- {repo/non-software changes, use sparingly}

**Full Changelog**: https://github.com/erikbelusic/vdiff-electron/compare/v{previous_version}...v{new_version}
```

- Use `gh release edit v{new_version} --draft=false` with `--notes` to set the release body and mark it as published
- Output the release URL to the user
