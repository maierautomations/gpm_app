# 🚀 Deploy Edge Functions via Supabase Dashboard (No Docker Needed!)

This guide shows you how to deploy your Edge Functions directly through the Supabase Dashboard - no Docker, no CLI complications, just copy and paste!

## ✅ Prerequisites

Before you start:

1. **Supabase Project ID**: `cicpnssrptuawxtmckiq` (already set up)
2. **Dashboard Access**: Log into https://supabase.com/dashboard
3. **Function Files**: Located in `supabase-edge-functions-dashboard/` folder

## 📋 Step-by-Step Deployment

### Step 1: Navigate to Edge Functions

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select Your Project**: Grill-Partner Maier
3. **Click "Edge Functions"** in the left sidebar
4. **Click "New Function"** button (green button)

---

### Step 2: Deploy `send-notification` Function

#### 2.1 Create the Function

1. **Function Name**: `send-notification` (exactly as shown)
2. **Click "Create function"**

#### 2.2 Copy the Code

1. Open file: `supabase-edge-functions-dashboard/send-notification-dashboard.ts`
2. **Copy ALL the code** (Ctrl+A, Ctrl+C or Cmd+A, Cmd+C)
3. **Paste into the editor** in Supabase Dashboard
4. **Click "Deploy"** button

#### 2.3 Set Environment Variables

After deployment, in the function details:

1. Click **"Secrets"** tab
2. Add these if not already present:
   - `SUPABASE_URL`: Already set (automatic)
   - `SUPABASE_SERVICE_ROLE_KEY`: Already set (automatic)
3. Click **"Save"**

---

### Step 3: Deploy `schedule-notifications` Function

#### 3.1 Create the Function

1. Go back to Edge Functions list
2. Click **"New Function"** again
3. **Function Name**: `schedule-notifications`
4. Click **"Create function"**

#### 3.2 Copy the Code

1. Open file: `supabase-edge-functions-dashboard/schedule-notifications-dashboard.ts`
2. **Copy ALL the code**
3. **Paste into the editor**
4. **Click "Deploy"**

---

### Step 4: Deploy `notification-cron` Function

#### 4.1 Create the Function

1. Click **"New Function"** again
2. **Function Name**: `notification-cron`
3. Click **"Create function"**

#### 4.2 Copy the Code

1. Open file: `supabase-edge-functions-dashboard/notification-cron-dashboard.ts`
2. **Copy ALL the code**
3. **Paste into the editor**
4. **Click "Deploy"**

---

## ✅ Verification: Test Your Functions

### Test 1: send-notification Function

Open a terminal and run:

```bash
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/send-notification" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY3Buc3NycHR1YXd4dG1ja2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQ3MzcsImV4cCI6MjA2ODM2MDczN30.Vq2qpe1d02Bp5sXT81RfhpqAaiUAbOq7ezmOiVTs1GE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "title": "Test from Dashboard",
    "body": "Your Edge Functions are working!",
    "target_audience": {"all": true}
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Notification sent to X users",
  "sent_count": X
}
```

### Test 2: schedule-notifications Function

```bash
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/schedule-notifications" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY3Buc3NycHR1YXd4dG1ja2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQ3MzcsImV4cCI6MjA2ODM2MDczN30.Vq2qpe1d02Bp5sXT81RfhpqAaiUAbOq7ezmOiVTs1GE" \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly_offers"}'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Scheduled 1 notifications",
  "type": "weekly_offers",
  "scheduled_count": 1
}
```

### Test 3: notification-cron Function

```bash
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/notification-cron" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY3Buc3NycHR1YXd4dG1ja2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQ3MzcsImV4cCI6MjA2ODM2MDczN30.Vq2qpe1d02Bp5sXT81RfhpqAaiUAbOq7ezmOiVTs1GE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Processed 0 scheduled notifications",
  "execution_time_ms": 123,
  "results": {
    "processed": 0,
    "sent": 0,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## 🔧 Setting Up Automated Cron Job

To make `notification-cron` run automatically every hour:

### Option A: Using Supabase Database Webhooks

1. Go to **Database → Webhooks** in Supabase Dashboard
2. Click **"Create a new webhook"**
3. Configure:
   - **Name**: `notification-cron-hourly`
   - **Table**: `scheduled_notifications`
   - **Events**: Insert, Update
   - **URL**: `https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/notification-cron`
   - **Headers**: Add `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

### Option B: Using pg_cron (Advanced)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly cron job
SELECT cron.schedule(
  'process-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
    SELECT
      net.http_post(
        url := 'https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/notification-cron',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body := jsonb_build_object()
      ) AS request_id;
  $$
);
```

### Option C: External Cron Service (Simplest)

Use a free service like [cron-job.org](https://cron-job.org):

1. Create free account
2. Add new cron job
3. **URL**: `https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/notification-cron`
4. **Schedule**: Every hour
5. **Headers**: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

---

## 🎯 What Happens After Deployment?

Once all three functions are deployed:

### Automated Notifications Work!

1. **Weekly Offers (Monday 10 AM)**

   - Automatically detects active week
   - Creates notification with current offers
   - Sends to all users with `weeklyOffers: true`

2. **Event Reminders (Day Before 6 PM)**

   - Scans upcoming events
   - Schedules reminders for tomorrow's events
   - Sends evening before event

3. **Manual Control via Admin Panel**
   - Open `admin-notification-panel.html`
   - Send instant notifications
   - Schedule custom notifications
   - View statistics

### Your App Works Without Changes!

- ✅ NotificationService already configured
- ✅ URLs point to correct endpoints
- ✅ Permissions handled automatically
- ✅ Deep linking works

---

## 🎉 Success Checklist

After following this guide, you should have:

- [ ] 3 Edge Functions visible in Dashboard
- [ ] All functions show "Active" status
- [ ] Test commands return success responses
- [ ] Cron job configured (any method)
- [ ] Admin panel can send notifications
- [ ] App receives push notifications

---

## 🚨 Troubleshooting

### Issue: "Function not found" error

**Solution**: Check function name is exactly: `send-notification`, `schedule-notifications`, `notification-cron`

### Issue: "Authorization failed"

**Solution**:

1. Get service role key from Settings → API
2. Replace `YOUR_SERVICE_ROLE_KEY` in test commands

### Issue: Functions don't appear after deployment

**Solution**:

1. Check for deployment errors in Dashboard
2. Make sure you clicked "Deploy" after pasting code
3. Refresh the Edge Functions page

### Issue: No notifications received

**Check**:

1. Users have push tokens in `push_tokens` table
2. Notification settings enabled in app
3. Test on physical device (not emulator)

---

## 📊 Monitor Your Functions

View function logs in Dashboard:

1. Go to **Edge Functions**
2. Click on any function
3. Click **"Logs"** tab
4. See real-time execution logs

---

## ✅ Deployment Complete!

**Congratulations!** 🎉 Your push notification system is now:

- ✅ Fully deployed
- ✅ Automated
- ✅ Production-ready
- ✅ No Docker needed!

### What You've Achieved:

- Professional push notification system
- Automated weekly offers
- Event reminder automation
- Admin control panel
- User preference management
- Security with RLS policies

### Next Steps:

1. Test with your app: `npm start`
2. Send test notification from admin panel
3. Watch the magic happen on Monday 10 AM!

---

## 💡 Pro Tips

1. **Monitor Usage**: Check Edge Functions metrics in Dashboard
2. **Test Regularly**: Use admin panel to test notifications weekly
3. **Update Offers**: Keep your `angebotskalender_weeks` table updated
4. **Track Success**: Monitor `notification_history` table for delivery stats

Your notification system is now live and automated! 🚀
