## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local testing & cron

Follow these steps to test the API and run the cron job locally.

1. Start Next.js dev server

```powershell
cd "D:\my projects\cron\quiet-hours"
npm run dev
```

2. Start local MongoDB (Docker)

```powershell
docker run -d --name local-mongo -p 27017:27017 mongo:7
# set MONGODB_URI in .env to mongodb://localhost:27017/quiet-hours
```

3. Set required environment variables in `.env` (project root)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONGODB_URI=mongodb://127.0.0.1:27017/quiet-hours
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=you@example.com
```

4. Create a Supabase user and obtain an access token

- Use your app's login flow or a small Node script to sign in a user and log `data.session.access_token`.

Example `getToken.js` (in project root):

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async function() {
	const { data, error } = await supabase.auth.signInWithPassword({
		email: 'mustiudaya@gmail.com',
		password: 'yourpassword'
	});
	if (error) return console.error(error);
	console.log('access token:', data.session.access_token);
})();
```

5. POST a block to the API

PowerShell example:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/blocks" -Method POST -Headers @{Authorization="Bearer <access_token>"; "Content-Type"="application/json"} -Body '{"title":"Study for math","start_time":"2025-09-21T13:35:00Z","end_time":"2025-09-21T14:35:00Z"}'
```

curl example (Unix):

```bash
curl -X POST http://localhost:3000/api/blocks \
	-H "Authorization: Bearer <access_token>" \
	-H "Content-Type: application/json" \
	-d '{"title":"Study for math","start_time":"2025-09-21T13:35:00Z","end_time":"2025-09-21T14:35:00Z"}'
```

6. Run the cron job manually

```powershell
npm run cron
```

The cron job (`cron/sendNotifications.js`) will:
- connect to MongoDB
- find unsent blocks scheduled ~10 minutes from now
- mark them as `notified: true` and send emails via SendGrid

Troubleshooting
- "Invalid token": use a valid Supabase user access token (not anon or service key).
- "Permission denied writing .next/trace": delete `.next` and ensure no process is locking files.
- SendGrid: ensure `SENDGRID_API_KEY` starts with `SG.` and `FROM_EMAIL` is set.
- MongoDB: ensure `MONGODB_URI` points to a running MongoDB instance.
