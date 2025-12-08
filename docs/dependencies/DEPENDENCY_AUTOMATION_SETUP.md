# Dependency Automation Setup Guide

This guide will help you enable automated dependency updates for your repository.

## Quick Start

### Option 1: Dependabot (Recommended - Built into GitHub)

**Configuration File:** `.github/dependabot.yml` (YAML format, not JSON)

✅ **Already configured!** The configuration file is in place. Just enable it:

1. **Go to your repository on GitHub**
2. **Click "Settings"** → **"Code security and analysis"**
3. **Find "Dependabot alerts"** and click **"Enable"**
4. **Find "Dependabot version updates"** and click **"Enable"**

**Note:** Without the `.github/dependabot.yml` file, Dependabot would only provide security updates. With the config file, you get:
- ✅ Version updates (patch, minor, major)
- ✅ Customizable schedule
- ✅ Grouped updates
- ✅ Auto-merge configuration

That's it! Dependabot will start creating PRs automatically.

### Option 2: Renovate (More Powerful Alternative)

If you prefer Renovate over Dependabot:

1. **Install Renovate GitHub App:**
   - Go to https://github.com/apps/renovate
   - Click "Install"
   - Select your repository
   - Grant necessary permissions

2. **Renovate will automatically:**
   - Read `renovate.json` configuration
   - Start creating PRs for updates
   - Use the same schedule and rules

**Note:** If using Renovate, you may want to disable Dependabot to avoid duplicate PRs.

## What Happens Next?

### Automatic Updates

1. **Weekly Schedule:** Every Monday at 9 AM UTC, Dependabot checks for updates
2. **Creates PRs:** Opens pull requests for available updates
3. **Runs CI:** All PRs run your test suite automatically
4. **Auto-Merges:** Patch/minor updates that pass CI are merged automatically
5. **Requires Review:** Major updates wait for your approval

### Security Updates

- Security updates are created **immediately** (not waiting for schedule)
- They have the "security" label
- They are auto-merged if they pass CI

## Monitoring

### View Updates

- **GitHub PRs:** Filter by "dependencies" label
- **GitHub Issues:** Check for security vulnerability reports
- **Email Notifications:** Configure in GitHub settings

### Manual Checks

Run these commands locally:

```bash
# Check for outdated packages
npm run deps:check

# Check for security vulnerabilities
npm run deps:audit

# Detailed report
npm run deps:check-manual
```

## Configuration

### Change Update Frequency

Edit `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily"  # or "weekly", "monthly"
```

### Ignore Specific Packages

Edit `.github/dependabot.yml`:

```yaml
ignore:
  - dependency-name: "package-name"
    update-types: ["version-update:semver-major"]
```

### Disable Auto-Merge

1. Delete or disable `.github/workflows/auto-merge-dependabot.yml`
2. Or modify it to never auto-merge

## Troubleshooting

### Dependabot Not Creating PRs

1. ✅ Check repository settings → Code security and analysis
2. ✅ Verify `.github/dependabot.yml` exists and is valid
3. ✅ Check GitHub Actions logs for errors
4. ✅ Ensure Dependabot has write access to the repository

### Auto-Merge Not Working

1. ✅ Check workflow permissions in repository settings
2. ✅ Verify CI tests are passing
3. ✅ Check that PRs have the "dependencies" label
4. ✅ Review workflow logs in Actions tab

### Too Many PRs

1. ✅ Enable grouping in `dependabot.yml` (already configured)
2. ✅ Increase `open-pull-requests-limit`
3. ✅ Consider using Renovate for better grouping

## Best Practices

1. **Review Major Updates:** Always review major version updates
2. **Monitor Security:** Check GitHub issues for security reports
3. **Test Before Merging:** Ensure CI passes before merging
4. **Keep Updated:** Don't let dependencies get too outdated
5. **Pin Critical Packages:** Consider pinning critical packages to specific versions

## Cost

- **Dependabot:** Free (built into GitHub)
- **Renovate:** Free for public repos, paid for private repos
- **CI Costs:** Minimal (only runs on PRs)

## Next Steps

1. ✅ Enable Dependabot in repository settings
2. ⚠️ Review the first few PRs to ensure everything works
3. ⚠️ Adjust configuration as needed
4. ⚠️ Set up email notifications for security updates

---

**Questions?** See [DEPENDENCY_MANAGEMENT.md](./DEPENDENCY_MANAGEMENT.md) for detailed documentation.

