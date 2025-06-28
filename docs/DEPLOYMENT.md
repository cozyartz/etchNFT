# EtchNFT Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **Cloudflare Account** with Pages and D1 access
2. **Domain** configured in Cloudflare
3. **Payment Provider Accounts** (Square, Coinbase Commerce)
4. **Email Service Account** (Resend)
5. **NFT Data Provider Account** (SimpleHash)

## Step 1: Environment Variables Setup

### Required Environment Variables

#### 1. Square Payments
```bash
PUBLIC_SQUARE_APP_ID=sq0idp-XXXXXXXXXXXXXXXXXXXXXXXX
PUBLIC_SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get these:**
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or use existing
3. Copy Application ID and Location ID from the app dashboard
4. **Important:** Use production credentials for live deployment

#### 2. SimpleHash API (NFT Data)
```bash
SIMPLEHASH_API_KEY=sh_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get this:**
1. Sign up at [SimpleHash](https://simplehash.com/)
2. Create an API key in your dashboard
3. Choose appropriate plan based on expected usage

#### 3. Coinbase Commerce (Crypto Payments)
```bash
COINBASE_COMMERCE_API_KEY=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

**How to get this:**
1. Sign up at [Coinbase Commerce](https://commerce.coinbase.com/)
2. Go to Settings > API Keys
3. Create a new API key
4. **Important:** Set up webhooks pointing to `https://yourdomain.com/api/coinbase`

#### 4. Resend (Email Service)
```bash
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get this:**
1. Sign up at [Resend](https://resend.com/)
2. Go to API Keys section
3. Create a new API key
4. Verify your sending domain

#### 5. GitHub OAuth (Admin Access)
```bash
GITHUB_CLIENT_ID=XXXXXXXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get these:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `https://yourdomain.com/api/auth/callback/github`
4. Copy Client ID and Client Secret

## Step 2: Cloudflare D1 Database Setup

### Create D1 Database
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create etchnft

# Apply schema
wrangler d1 execute etchnft --file=./migrations/init.sql
```

### Update wrangler.toml
```toml
name = "etchnft"
compatibility_date = "2024-05-18"

[[d1_databases]]
binding = "DB"
database_name = "etchnft"
database_id = "your-database-id-from-creation"
```

## Step 3: Cloudflare Pages Deployment

### Option A: Connect GitHub Repository
1. Go to Cloudflare Dashboard > Pages
2. Connect your GitHub repository
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`

### Option B: Direct Upload
```bash
# Build the project
npm run build

# Deploy using Wrangler
wrangler pages deploy dist
```

### Configure Environment Variables in Cloudflare
1. Go to your Pages project > Settings > Environment variables
2. Add all the environment variables from `.env.example`
3. Set them for both **Production** and **Preview** environments

## Step 4: Domain Configuration

### Custom Domain Setup
1. In Cloudflare Pages, go to Custom domains
2. Add your domain (e.g., `etchnft.com`)
3. Update DNS records as instructed
4. Enable SSL/TLS encryption

### DNS Records Example
```
Type: CNAME
Name: @
Content: your-pages-project.pages.dev
Proxy: Enabled (Orange cloud)
```

## Step 5: Webhook Configuration

### Coinbase Commerce Webhooks
1. Go to Coinbase Commerce Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/coinbase`
3. Select events: `charge:confirmed`, `charge:failed`
4. Save webhook secret for verification (optional)

## Step 6: Testing Production Setup

### Pre-launch Checklist
- [ ] All environment variables set in Cloudflare
- [ ] D1 database created and schema applied
- [ ] Domain configured and SSL enabled
- [ ] Square payments working (test with small amount)
- [ ] Coinbase Commerce webhooks receiving events
- [ ] Email notifications sending correctly
- [ ] NFT data loading from wallets
- [ ] Admin dashboard accessible
- [ ] Certificate generation working

### Test Payment Flow
1. Connect a test wallet with NFTs
2. Add NFT to cart
3. Complete checkout with test payment
4. Verify order appears in admin dashboard
5. Check email confirmation sent
6. Verify certificate generation

## Step 7: Monitoring & Analytics

### Optional Integrations
```bash
# Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Security Considerations

1. **API Keys:** Never commit real API keys to version control
2. **HTTPS:** Ensure all traffic uses HTTPS
3. **CORS:** Configure appropriate CORS headers
4. **Rate Limiting:** Consider implementing rate limiting for API endpoints
5. **Input Validation:** Validate all user inputs server-side

## Troubleshooting

### Common Issues

#### 1. Square Payments Not Loading
- Check if `PUBLIC_SQUARE_APP_ID` is set correctly
- Verify Square SDK is loading in browser
- Check browser console for errors

#### 2. NFTs Not Loading
- Verify `SIMPLEHASH_API_KEY` is valid
- Check API rate limits
- Ensure wallet addresses are valid

#### 3. Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check domain verification in Resend
- Review email templates for errors

#### 4. Database Errors
- Ensure D1 database is properly bound
- Check if schema was applied correctly
- Verify database permissions

### Support Resources
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Square Developer Docs](https://developer.squareup.com/docs)
- [Coinbase Commerce Docs](https://commerce.coinbase.com/docs/)