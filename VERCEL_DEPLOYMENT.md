# 🚀 Vercel Deployment Guide

## Prerequisites
- Node.js 16+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Vercel account (free at [vercel.com](https://vercel.com))

## Quick Deploy

### Method 1: Using Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from root directory**
   ```bash
   cd /Users/rishuraj/RoboticsClubDoorLock
   vercel
   ```

3. **Follow the prompts**:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Your account
   - **Link to existing project?** → No
   - **Project name?** → robotics-door-lock (or your choice)
   - **In which directory is your code located?** → ./
   - **Want to override settings?** → No

4. **Set Environment Variables**:
   ```bash
   vercel env add BREVO_API_KEY
   vercel env add EMAIL_USER
   vercel env add SPREADSHEET_ID
   vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
   vercel env add GOOGLE_PRIVATE_KEY
   vercel env add MEMBER_REG_NO_COL
   vercel env add MEMBER_EMAIL_COL
   vercel env add MEMBER_PASSWORD_COL
   vercel env add ADMIN_COL
   vercel env add DOOR_OTP_COL
   vercel env add MEMBER_DATA_LOGGING_COLUMN_NAME_INDEX
   vercel env add MEMBER_DATA_LOGGING_COLUMN_REGNO_INDEX
   vercel env add MEMBER_DATA_LOGGING_COLUMN_EMAIL_INDEX
   vercel env add MEMBER_DATA_LOGGING_COLUMN_PASSWORD_INDEX
   vercel env add MEMBER_DATA_LOGGING_COLUMN_TIMESTAMP_INDEX
   vercel env add NODE_ENV
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Method 2: Using GitHub Integration (Best for Continuous Deployment)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect settings

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: frontend/dist
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   Go to Project Settings → Environment Variables and add all variables from `.env.example`

5. **Deploy**: Click "Deploy" and wait for build to complete

## Environment Variables Required

```env
# Brevo Email Service
BREVO_API_KEY=xkeysib-your-key
EMAIL_USER=your-verified-sender@email.com

# Google Sheets
SPREADSHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@account.email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Column Indices (0-based)
MEMBER_REG_NO_COL=1
MEMBER_EMAIL_COL=2
MEMBER_PASSWORD_COL=3
ADMIN_COL=4
DOOR_OTP_COL=5

# Member Data Logging Columns
MEMBER_DATA_LOGGING_COLUMN_NAME_INDEX=0
MEMBER_DATA_LOGGING_COLUMN_REGNO_INDEX=1
MEMBER_DATA_LOGGING_COLUMN_EMAIL_INDEX=2
MEMBER_DATA_LOGGING_COLUMN_PASSWORD_INDEX=3
MEMBER_DATA_LOGGING_COLUMN_TIMESTAMP_INDEX=6

# Environment
NODE_ENV=production
```

## Post-Deployment Checklist

### 1. Test Basic Functionality
- [ ] Visit your Vercel URL: `https://your-project.vercel.app`
- [ ] Frontend loads correctly
- [ ] Can access login page

### 2. Test Admin Login
- [ ] Enter admin email (from Google Sheet Column E)
- [ ] Receive OTP email via Brevo
- [ ] Successfully login with OTP

### 3. Test Member Entry
- [ ] Add new member with name, reg no, email
- [ ] Verify 8-digit password generated correctly
- [ ] Check member receives welcome email
- [ ] Verify data appears in Google Sheet

### 4. Test Password Management
- [ ] Change member password
- [ ] Verify new password sent via email
- [ ] Check Sheet updated with new password

### 5. Test Door OTP
- [ ] Generate door OTP
- [ ] Verify OTP shows with timer
- [ ] Confirm OTP saved to Sheet

### 6. Test Member Logs
- [ ] View member logs table
- [ ] Search functionality works
- [ ] Export to CSV works
- [ ] Data refreshes correctly

## Troubleshooting

### Issue: Build Fails
**Solution**: Check TypeScript errors
```bash
cd frontend
npm run build
```

### Issue: API Calls Fail
**Solution**: Check environment variables are set in Vercel dashboard
- Go to Project Settings → Environment Variables
- Ensure all variables are present
- Redeploy after adding variables

### Issue: Frontend Shows But API Doesn't Work
**Solution**: Check API routes configuration
- Ensure `vercel.json` is correct
- API routes should be under `/api/*`
- Frontend should use `API_URL=/api`

### Issue: Google Sheets Not Working
**Solution**: Verify service account
- Check `GOOGLE_PRIVATE_KEY` has proper newlines
- Format: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
- Ensure service account has edit access to the sheet

### Issue: Emails Not Sending
**Solution**: Verify Brevo configuration
- Check `BREVO_API_KEY` is valid
- Verify `EMAIL_USER` is a verified sender in Brevo
- Check Brevo dashboard for error logs

## Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

## Monitoring & Logs

### View Deployment Logs
```bash
vercel logs your-deployment-url
```

### View Runtime Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by function or time range

## Updating Your Deployment

### For GitHub Integration (Automatic)
```bash
git add .
git commit -m "Update: your changes"
git push origin main
# Vercel auto-deploys on push
```

### For CLI Deployment (Manual)
```bash
vercel --prod
```

## Performance Optimization

### Enable Edge Network
- Automatically enabled on Vercel
- Static assets cached globally
- API runs on serverless functions

### Monitor Performance
- Go to Vercel Dashboard → Analytics
- Check response times
- Monitor bandwidth usage

## Security Best Practices

1. **Never commit `.env` file**
2. **Rotate API keys regularly**
3. **Use environment variables for all secrets**
4. **Enable HTTPS** (automatic on Vercel)
5. **Review access logs** periodically

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: GitHub Issues
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

## Production URL

After deployment, your app will be available at:
```
https://robotics-door-lock.vercel.app
```

Or your custom domain if configured.

---

🎉 **Congratulations!** Your Robotics Club Door Lock System is now live on Vercel!
