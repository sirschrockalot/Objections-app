# Automated Dependency Management

This document explains how dependency updates are automated in this project.

## Overview

We use **Dependabot** (GitHub's built-in solution) to automatically keep dependencies up to date. This reduces security risks and ensures you're using the latest features and bug fixes.

**Configuration File:** `.github/dependabot.yml` (YAML format)

**Important:** Dependabot can work without a config file, but it will **only provide security updates**. To enable version updates (patch, minor, major), you need the `.github/dependabot.yml` file, which is already configured in this repository.

## How It Works

### 1. Dependabot (Primary Solution)

**Configuration:** `.github/dependabot.yml`

- **Schedule:** Checks for updates every Monday at 9 AM UTC
- **Grouping:** Groups patch and minor updates together to reduce PR noise
- **Auto-merge:** Patch updates that pass CI are automatically merged
- **Manual Review:** Major version updates require manual review

**What Dependabot Does:**
- Creates pull requests for dependency updates
- Groups related updates together
- Runs CI tests before merging
- Labels PRs appropriately

### 2. Renovate (Alternative - More Powerful)

**Configuration:** `renovate.json`

Renovate is a more powerful alternative that offers:
- More granular control over update strategies
- Better grouping and scheduling options
- Support for multiple package managers
- Advanced auto-merge rules

**To Enable Renovate:**
1. Install the [Renovate GitHub App](https://github.com/apps/renovate)
2. Grant it access to this repository
3. It will automatically use `renovate.json` configuration

**Note:** You can use both Dependabot and Renovate, but it's recommended to use only one to avoid duplicate PRs.

## Auto-Merge Strategy

### Safe to Auto-Merge
- ✅ **Patch updates** (1.0.0 → 1.0.1) - Bug fixes only
- ✅ **Minor updates** (1.0.0 → 1.1.0) - New features, backward compatible
- ✅ **Security updates** - Critical for security

### Requires Manual Review
- ⚠️ **Major updates** (1.0.0 → 2.0.0) - May contain breaking changes
- ⚠️ **Critical packages** (React, Next.js, TypeScript, Mongoose) - Even minor updates require review

## Workflows

### 1. Auto-Merge Workflow
**File:** `.github/workflows/auto-merge-dependabot.yml`

- Automatically merges Dependabot PRs that:
  - Pass all CI tests
  - Are patch/minor updates (not major)
  - Have the "dependencies" label

### 2. Dependency Update Check
**File:** `.github/workflows/dependency-update-check.yml`

- Runs weekly (Monday 9 AM UTC)
- Checks for outdated packages
- Runs security audit
- Creates GitHub issues for security vulnerabilities
- Does NOT create PRs (that's Dependabot's job)

## Manual Commands

If you want to check dependencies manually:

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities automatically (if possible)
npm audit fix

# Update all dependencies to latest (use with caution)
npx npm-check-updates -u
npm install
```

## Configuration Options

### Ignore Specific Packages

To ignore updates for specific packages, edit `.github/dependabot.yml`:

```yaml
ignore:
  - dependency-name: "package-name"
    update-types: ["version-update:semver-major"]
```

### Change Update Frequency

Edit the schedule in `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily"  # or "weekly", "monthly"
  day: "monday"
  time: "09:00"
```

### Disable Auto-Merge

To disable auto-merge and require manual review for all updates:

1. Remove or comment out `.github/workflows/auto-merge-dependabot.yml`
2. Or modify the workflow to never auto-merge

## Best Practices

1. **Review Major Updates:** Always review major version updates before merging
2. **Test Before Merging:** Ensure CI passes before merging updates
3. **Monitor Security Issues:** Check GitHub issues for security vulnerability reports
4. **Update Regularly:** Don't let dependencies get too outdated
5. **Pin Critical Versions:** For critical packages, consider pinning to specific versions

## Troubleshooting

### Dependabot Not Creating PRs

1. Check that Dependabot is enabled in repository settings
2. Verify `.github/dependabot.yml` is correct
3. Check GitHub Actions logs for errors

### Auto-Merge Not Working

1. Ensure the workflow has proper permissions
2. Check that CI tests are passing
3. Verify the PR has the correct labels

### Too Many PRs

1. Enable grouping in `dependabot.yml`
2. Increase `open-pull-requests-limit`
3. Consider using Renovate for better grouping

## Security Updates

Security updates are prioritized and will:
- Be created immediately (not waiting for schedule)
- Have "security" label
- Be auto-merged if they pass CI (unless configured otherwise)

## Cost Considerations

- **Dependabot:** Free (built into GitHub)
- **Renovate:** Free for public repos, paid for private repos
- **CI Costs:** Minimal (only runs on PRs)

## Monitoring

You can monitor dependency updates by:
1. **GitHub PRs:** Check the "dependencies" label filter
2. **GitHub Issues:** Check for security vulnerability reports
3. **CI Logs:** Review test results for each update

## Next Steps

1. ✅ Dependabot is configured and will start working automatically
2. ⚠️ Review the first few PRs to ensure everything works correctly
3. ⚠️ Adjust configuration as needed based on your preferences
4. ⚠️ Consider enabling Renovate if you need more advanced features

---

**Last Updated:** 2024-12-08

