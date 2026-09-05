# Security Policy

## Overview

Hourglass Command is a training and exercise toolkit for corporate security operations professionals. It is designed for educational purposes and does not process, store, or transmit sensitive operational data in production environments.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Scope

This security policy applies to:

- The core TypeScript library (`@gsoc-decision-ops/core`)
- The Next.js web application (`@gsoc-decision-ops/web`)
- Documentation and example files

### Out of Scope

- Third-party dependencies (report to respective maintainers)
- Deployment infrastructure (your responsibility)
- User-generated content within the application

## Reporting a Vulnerability

If you discover a security vulnerability in Hourglass Command:

### Do

1. **Report privately**: Email security concerns to the repository maintainer
2. **Provide details**: Include steps to reproduce, potential impact, and suggested fixes
3. **Allow time**: Give maintainers reasonable time to address the issue before public disclosure

### Don't

1. **Don't open public issues** for security vulnerabilities
2. **Don't exploit vulnerabilities** for any purpose other than research
3. **Don't disclose publicly** before maintainers have addressed the issue

## Security Considerations

### Training Data

- All scenarios in this toolkit are **synthetic and fictional**
- Do not input real incident data into the training application
- Exported reports are designed for training purposes only

### Deployment

If deploying this application:

1. **No sensitive data**: Do not use for actual incident documentation
2. **Access control**: Implement appropriate authentication if deployed publicly
3. **HTTPS**: Use TLS for any network deployment
4. **Dependencies**: Regularly update dependencies for security patches

### Data Handling

The application:

- Does not require authentication by default
- Does not persist data to external databases
- Does not transmit data to external services
- Stores data in browser memory/localStorage only

## Best Practices for Users

1. **Training only**: Use only for training and exercises, not production incidents
2. **Fictional data**: Use only fictional scenarios and data
3. **Local deployment**: For sensitive training, deploy locally only
4. **Regular updates**: Keep the application updated

## Acknowledgments

We appreciate responsible disclosure of security issues. Contributors who report valid vulnerabilities will be acknowledged (with permission) in release notes.

---

_This security policy is subject to change. Check back regularly for updates._
