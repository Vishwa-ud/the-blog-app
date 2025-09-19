# CI/CD Pipeline Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete CI/CD pipeline with security scanning for your blog app.

## 📋 Prerequisites

1. GitHub repository with admin access
2. Fly.io account (for backend deployment)
3. Frontend hosting service account (Vercel/Netlify)
4. Slack workspace (for notifications)

## 🔐 Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Essential Secrets
```
FLY_API_TOKEN=your_fly_io_api_token
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Optional Security Tool Secrets
```
SNYK_TOKEN=your_snyk_token
SEMGREP_APP_TOKEN=your_semgrep_token
VERCEL_TOKEN=your_vercel_token (if using Vercel)
NETLIFY_AUTH_TOKEN=your_netlify_token (if using Netlify)
```

## 🛠️ Setup Instructions

### 1. GitHub Repository Configuration

1. Enable GitHub Actions in your repository
2. Go to `Settings > Security > Code security and analysis`
3. Enable:
   - Dependency graph
   - Dependabot alerts
   - Dependabot security updates
   - Code scanning alerts

### 2. Fly.io Configuration

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Get your API token: `fly auth token`
4. Add token to GitHub secrets as `FLY_API_TOKEN`

### 3. Slack Notifications Setup

1. Go to your Slack workspace
2. Create a new app at https://api.slack.com/apps
3. Enable Incoming Webhooks
4. Create a webhook URL for your channel
5. Add webhook URL to GitHub secrets as `SLACK_WEBHOOK_URL`

### 4. Security Tools Setup (Optional but Recommended)

#### Snyk (Vulnerability Scanning)
1. Sign up at https://snyk.io/
2. Get your API token from Account Settings
3. Add to GitHub secrets as `SNYK_TOKEN`

#### Semgrep (Static Analysis)
1. Sign up at https://semgrep.dev/
2. Get your app token from Settings
3. Add to GitHub secrets as `SEMGREP_APP_TOKEN`

## 🔄 Workflow Triggers

### Automatic Triggers
- **Push to main/develop**: Full CI/CD pipeline
- **Pull Requests**: Security scans and code quality checks
- **Daily at 6 AM**: Dependency vulnerability scans
- **Weekly on Monday**: Full security audit

### Manual Triggers
- Go to Actions tab in GitHub
- Select workflow
- Click "Run workflow"

## 📊 Understanding the Pipeline

### 1. CI/CD Pipeline (`ci-cd.yml`)
- Code quality checks with ESLint
- Security vulnerability scanning
- Test execution
- Docker build and security scan
- Automated deployment

### 2. CodeQL Analysis (`codeql.yml`)
- Semantic code analysis
- Security vulnerability detection
- Runs on TypeScript/JavaScript code

### 3. Dependency Scanning (`dependency-scan.yml`)
- NPM audit for known vulnerabilities
- Dependency review for new dependencies
- Semgrep security scanning

### 4. Docker Security (`docker-security.yml`)
- Container vulnerability scanning with Trivy
- Dockerfile linting with Hadolint
- Docker Scout CVE scanning

### 5. Deployment (`deploy.yml`)
- Automated deployment to Fly.io
- Frontend deployment configuration
- Success/failure notifications

### 6. Monitoring (`monitoring.yml`)
- Daily security checks
- Performance monitoring setup
- Compliance reporting

## 🎯 Customization

### Adding New Environments
1. Create new environment in GitHub: `Settings > Environments`
2. Add protection rules if needed
3. Update deployment workflow

### Adding New Security Tools
1. Add tool configuration to workflow
2. Add required secrets
3. Configure output format (SARIF for GitHub integration)

### Modifying Deployment Targets
1. Update `deploy.yml` workflow
2. Add deployment-specific secrets
3. Configure environment-specific variables

## 🔍 Monitoring & Alerts

### Security Alerts
- GitHub Security tab shows all vulnerabilities
- Slack notifications for critical issues
- Daily security summary reports

### Performance Monitoring
- Lighthouse CI for frontend performance
- Custom metrics can be added

### Compliance Reporting
- Daily compliance checks
- Artifact uploads for audit trails

## 🚨 Troubleshooting

### Common Issues

1. **Workflow fails due to missing secrets**
   - Check all required secrets are configured
   - Verify secret names match exactly

2. **Docker build fails**
   - Check Dockerfile syntax
   - Verify base image availability

3. **Deployment fails**
   - Check Fly.io configuration
   - Verify API token permissions

4. **Security scans time out**
   - Reduce scan scope if needed
   - Check tool-specific rate limits

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review workflow YAML for configuration issues
- Check tool-specific documentation for advanced configuration

## 📈 Next Steps

1. **Monitor the pipeline** - Watch first few runs to ensure everything works
2. **Configure notifications** - Set up team notifications for failures
3. **Regular reviews** - Schedule monthly security and pipeline reviews
4. **Documentation updates** - Keep this guide updated as you make changes

---

**🔒 Security Note**: Never commit secrets to your repository. Always use GitHub Secrets or environment variables for sensitive information.