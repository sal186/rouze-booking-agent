# Rouze Booking Agent - Deployment Guide

## Current Status

### ✅ Completed
- GitHub repository created: `sal186/rouze-booking-agent`
- Initial files uploaded:
  - `lib/` folder with calendar.ts, db.ts, email.ts
  - `package.json` with all dependencies
  - `next.config.js` configuration file

### ⚠️ Remaining Tasks

## 1. Upload Remaining Project Files

The repository currently has only partial files. You need to upload the complete project from your `rouze-booking-agent.zip`.

**Option A: Using GitHub Web Interface**
1. Go to: https://github.com/sal186/rouze-booking-agent
2. Click "Add file" → "Upload files"
3. Extract your `rouze-booking-agent.zip` locally
4. Drag and drop ALL remaining files/folders to GitHub
5. Commit the changes

**Option B: Using Git Command Line**
```bash
# Extract your zip file first
cd rouze-booking-agent
git init
git remote add origin https://github.com/sal186/rouze-booking-agent.git
git add .
git commit -m "Add complete project files"
git push -u origin main
```

## 2. Create Vercel Account

You need a Vercel account to deploy the application.

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Complete the signup process

## 3. Deploy to Vercel

1. Log into Vercel: https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository: `sal186/rouze-booking-agent`
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: .next

## 4. Configure Environment Variables

In Vercel project settings, add these environment variables:

### Required for Email
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=bookings@rainesdev.com
```

### Optional for Google Calendar
```
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Database
```
DATABASE_PATH=./data/bookings.db
```

## 5. Configure Custom Domain

1. In Vercel project settings, go to "Domains"
2. Add domain: `book.rainesdev.com`
3. Vercel will provide DNS records
4. Update your DNS settings:
   - Add CNAME record: `book` → `cname.vercel-dns.com`
   - Or A record pointing to Vercel's IP

## 6. Test the Application

1. Visit your deployed URL (Vercel provides a .vercel.app URL)
2. Test the booking flow:
   - Select a service
   - Choose date/time
   - Fill in customer details
   - Submit booking
3. Check email notifications
4. Access admin dashboard at `/admin`

## 7. Set Up SendGrid (for Email Notifications)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Verify your sender email: `bookings@rainesdev.com`
4. Add the API key to Vercel environment variables

## Tech Stack Summary

- **Framework**: Next.js 14.2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Email**: Nodemailer with SendGrid
- **Calendar**: Google Calendar API (optional)

## Notes

- SQLite works on Vercel (database file persists in serverless functions)
- Admin page at `/admin` has no authentication by default (add basic auth if needed)
- Database file location: `/data/bookings.db`

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure all project files were uploaded to GitHub
4. Test email sending with SendGrid

---

**Repository**: https://github.com/sal186/rouze-booking-agent
**Target Domain**: book.rainesdev.com
