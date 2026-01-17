# Rouze Booking Agent 📅

A modern, intuitive booking system built with Next.js 14 for SMBs. Easily manage appointments with email notifications and optional Google Calendar integration.

## ✨ Features

- 📝 **Simple Booking Form** - Clean UI for customers to book services
- 📊 **Admin Dashboard** - View and manage all bookings
- 📧 **Email Notifications** - Automatic confirmation emails via SendGrid
- 📅 **Google Calendar Sync** (Optional) - Sync bookings to your calendar  
- 💾 **SQLite Database** - Lightweight, serverless-friendly storage
- 🎨 **Beautiful Design** - Tailwind CSS with gradient backgrounds
- 🚀 **Deploy-Ready** - Optimized for Vercel deployment

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Email**: Nodemailer with SendGrid
- **Calendar**: Google Calendar API (optional)

## 🚀 Quick Start

### 1. Deploy to Vercel (Easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sal186/rouze-booking-agent)

1. Click the button above or go to [vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub
3. Import this repository: `sal186/rouze-booking-agent`
4. Configure environment variables (see below)
5. Deploy!

### 2. Environment Variables

In Vercel, add these environment variables:

#### Required for Email:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=bookings@rainesdev.com
```

#### Optional for Google Calendar:
```
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### 3. Get SendGrid API Key

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Go to Settings > API Keys
3. Create a new API key with "Mail Send" permission
4. Copy the key and add it to Vercel environment variables
5. Verify your sender email address

### 4. Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Navigate to "Domains"
3. Add your domain: `book.rainesdev.com`
4. Follow Vercel's instructions to update your DNS settings

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/sal186/rouze-booking-agent.git
cd rouze-booking-agent

# Install dependencies
npm install

# Create .env.local file with your environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## 📝 Project Structure

```
rouze-booking-agent/
├── app/
│   ├── page.tsx              # Main booking form
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   └── api/
│       └── bookings/
│           └── route.ts      # API endpoints
├── lib/
│   ├── db.ts                 # Database functions
│   ├── email.ts              # Email sending
│   └── calendar.ts           # Google Calendar integration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🎯 Usage

### Customer Booking Flow
1. Visit your deployed URL
2. Select a service
3. Choose date and time
4. Enter contact details
5. Submit booking
6. Receive confirmation email

### Admin Dashboard
- Access at `/admin`
- View all bookings
- See customer details, dates, and service information
- **Note**: Add authentication before making public!

## 🔒 Security Notes

- The `/admin` route has **NO authentication** by default
- Add basic auth or implement proper authentication before production use
- Never commit `.env` files to version control
- Keep your API keys secure

## ⚙️ Configuration

### Customize Services

Edit the `SERVICES` array in:
- `app/page.tsx` (frontend)
- `app/api/bookings/route.ts` (backend)

```typescript
const SERVICES = [
  { id: 'haircut', name: 'Haircut', duration: 30, price: 50 },
  { id: 'coloring', name: 'Hair Coloring', duration: 90, price: 120 },
  // Add more services...
];
```

### Customize Business Hours

Edit the time options in `app/page.tsx`:

```tsx
<option value="09:00">9:00 AM</option>
<option value="10:00">10:00 AM</option>
// Add more times...
```

## 📦 Database

- Uses SQLite for simplicity
- Database file: `/data/bookings.db`
- Automatically created on first booking
- Works seamlessly on Vercel serverless functions

## 🐛 Troubleshooting

### Emails not sending?
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Look at Vercel function logs for errors

### Database errors?
- Ensure `/data` directory exists
- Check file permissions
- Vercel creates it automatically

### Build failures?
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run type-check`
- Verify all environment variables are set

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🔗 Links

- **Repository**: https://github.com/sal186/rouze-booking-agent
- **Deploy**: [Click here to deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/sal186/rouze-booking-agent)

## 👤 Support

For issues or questions:
1. Check the DEPLOYMENT.md file for detailed instructions
2. Review Vercel deployment logs
3. Verify environment variables are set correctly

---

**Built with ❤️ for SMBs**
