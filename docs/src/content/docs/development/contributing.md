---
title: Contributing Guide
description: How to contribute to EtchNFT development
---

# Contributing to EtchNFT

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements, your help makes EtchNFT better for everyone.

## Quick Contribution Checklist

- [ ] Fork the repository
- [ ] Create a feature branch from `main`
- [ ] Make your changes with clear commit messages
- [ ] Add tests for new functionality
- [ ] Update documentation as needed
- [ ] Submit a pull request with detailed description

## Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **Cloudflare account** for deployment testing
- **API keys** for external services (see [Environment Setup](/getting-started/environment/))

### Local Development

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/etchNFT.git
   cd etchNFT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup:env
   # Edit .env with your API keys
   npm run check:env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify everything works**
   - Visit `http://localhost:4321`
   - Test wallet connection
   - Verify API endpoints respond correctly

## Code Style & Standards

### TypeScript Guidelines

- **Strict mode**: All TypeScript must pass strict type checking
- **Interfaces over types**: Use interfaces for object shapes
- **Explicit return types**: For public functions and API endpoints
- **No `any` types**: Use proper typing or `unknown` with type guards

```typescript
// ✅ Good
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Attribute[];
}

function fetchNFT(address: string, tokenId: string): Promise<NFTMetadata> {
  // Implementation
}

// ❌ Avoid
function fetchNFT(address: any, tokenId: any): Promise<any> {
  // Implementation
}
```

### React Component Guidelines

- **Function components**: Use function components with hooks
- **TypeScript interfaces**: Define props interfaces
- **Error boundaries**: Wrap components that might fail
- **Accessibility**: Include ARIA labels and semantic HTML

```tsx
// ✅ Good
interface NFTCardProps {
  nft: NFTMetadata;
  onSelect: (nft: NFTMetadata) => void;
}

export function NFTCard({ nft, onSelect }: NFTCardProps) {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={() => onSelect(nft)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(nft)}
      aria-label={`Select ${nft.name} NFT`}
    >
      <img src={nft.image} alt={nft.name} />
      <h3>{nft.name}</h3>
    </div>
  );
}
```

### CSS/Styling Guidelines

- **Tailwind CSS**: Use Tailwind utilities for styling
- **Custom CSS**: Only when Tailwind is insufficient
- **Responsive design**: Mobile-first approach
- **Dark mode**: Support both light and dark themes

```astro
<!-- ✅ Good -->
<div class="glass p-6 rounded-xl hover:scale-105 transition-transform">
  <h2 class="text-xl font-bold text-accent mb-4">Title</h2>
  <p class="text-gray-300 dark:text-gray-700">Content</p>
</div>

<!-- ❌ Avoid inline styles -->
<div style="padding: 24px; background: rgba(255,255,255,0.1);">
  <h2 style="color: #41C6BB;">Title</h2>
</div>
```

## Testing Guidelines

### Unit Tests

Test individual functions and components:

```typescript
// tests/utils/nft.test.ts
import { validateNFTMetadata } from '@/lib/nft';

describe('validateNFTMetadata', () => {
  it('should validate correct NFT metadata', () => {
    const metadata = {
      name: 'Test NFT',
      description: 'A test NFT',
      image: 'https://example.com/image.png',
      attributes: []
    };
    
    expect(validateNFTMetadata(metadata)).toBe(true);
  });

  it('should reject invalid metadata', () => {
    const metadata = { name: 'Test NFT' }; // Missing required fields
    expect(validateNFTMetadata(metadata)).toBe(false);
  });
});
```

### Integration Tests

Test API endpoints and database interactions:

```typescript
// tests/api/nfts.test.ts
import { createTestContext } from '@/tests/helpers';

describe('/api/nfts', () => {
  it('should fetch NFT metadata', async () => {
    const response = await fetch('/api/nfts/0x123?tokenId=1&network=ethereum');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('image');
  });
});
```

### Component Tests

Test React components with user interactions:

```tsx
// tests/components/NFTCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NFTCard } from '@/components/react/NFTCard';

describe('NFTCard', () => {
  const mockNFT = {
    name: 'Test NFT',
    description: 'Test description',
    image: 'https://example.com/image.png',
    attributes: []
  };

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<NFTCard nft={mockNFT} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockNFT);
  });
});
```

## Commit Message Guidelines

Use conventional commits for clear history:

```bash
# Format: type(scope): description

# Types:
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks

# Examples:
feat(wallet): add Solana wallet support
fix(orders): resolve payment confirmation bug
docs(api): update NFT endpoint documentation
refactor(db): optimize query performance
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm run test
   npm run build
   ```

2. **Format code**
   ```bash
   npm run format
   ```

3. **Update documentation**
   - Update relevant docs in `/docs/`
   - Add JSDoc comments for new functions
   - Update CLAUDE.md if architecture changes

### PR Description Template

```markdown
## Summary
Brief description of changes and motivation.

## Changes
- [ ] Added new feature X
- [ ] Fixed bug Y
- [ ] Updated documentation Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
(For UI changes)

## Breaking Changes
(If any)

## Additional Notes
(Any additional context)
```

### Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Manual testing** for UI/UX changes
4. **Documentation review** for accuracy
5. **Security review** for sensitive changes

## Areas for Contribution

### High Priority

- **Multi-chain support**: Add new blockchain networks
- **Payment providers**: Integrate additional payment methods
- **Performance optimization**: Improve Core Web Vitals
- **Accessibility**: Enhance ARIA labels and keyboard navigation

### Medium Priority

- **Admin dashboard**: Enhance order management tools
- **Email templates**: Improve transactional email design
- **Mobile experience**: Optimize mobile wallet connections
- **Internationalization**: Add multi-language support

### Documentation Needs

- **Tutorials**: Step-by-step guides for common tasks
- **API examples**: More comprehensive API usage examples
- **Deployment guides**: Platform-specific deployment instructions
- **Troubleshooting**: Common issues and solutions

## Security Considerations

### Never Commit

- **Private keys** or wallet seeds
- **API keys** or secrets
- **Personal data** or user information
- **Database credentials** or connection strings

### Security Best Practices

- **Sanitize inputs**: Validate and sanitize all user inputs
- **HTTPS only**: Ensure all communications use HTTPS
- **Rate limiting**: Implement appropriate rate limits
- **Error handling**: Don't expose sensitive information in errors

## Community Guidelines

### Code of Conduct

- **Be respectful**: Treat all contributors with respect
- **Be collaborative**: Work together to solve problems
- **Be patient**: Help newcomers learn and contribute
- **Be constructive**: Provide helpful feedback

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Real-time chat with the community
- **Documentation**: Check docs first for answers
- **Issues**: Report bugs with detailed information

## Recognition

All contributors will be:
- **Added to contributors list** in the repository
- **Mentioned in release notes** for significant contributions
- **Invited to community events** and discussions
- **Given credit** in relevant documentation

Thank you for contributing to EtchNFT! 🚀