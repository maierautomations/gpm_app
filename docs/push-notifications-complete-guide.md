# 📱 Push Notifications System - Complete Technical Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [How Everything Works](#how-everything-works)
3. [Automated Notifications](#automated-notifications)
4. [Manual Notifications](#manual-notifications)
5. [Database Architecture](#database-architecture)
6. [Cost Analysis](#cost-analysis)
7. [Testing & Monitoring](#testing--monitoring)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR COMPLETE SYSTEM                      │
├────────────────┬────────────────┬─────────────────────────────┤
│   CLIENT APP   │  EDGE FUNCTIONS │      DATABASE              │
├────────────────┼────────────────┼─────────────────────────────┤
│ • React Native │ • send-notif    │ • push_tokens              │
│ • Expo SDK 54  │ • schedule-notif│ • notification_history     │
│ • Notification │ • notif-cron    │ • scheduled_notifications  │
│   Service      │                 │ • angebotskalender_*       │
│ • User Prefs   │                 │ • events                   │
└────────────────┴────────────────┴─────────────────────────────┘
```

### Data Flow Diagram

```
User Opens App → Grants Permission → Token Registered → 
→ Preferences Set → Ready for Notifications

Automated Flow:
Cron Job (hourly) → Check scheduled_notifications → 
→ Send due notifications → Update history → User receives

Manual Flow:
Admin Panel → send-notification function → 
→ Query push_tokens → Send via Expo → User receives
```

---

## 🔄 How Everything Works

### 1. User Registration Flow

**When a user first opens the app:**

```javascript
1. App starts → NotificationService.initialize()
2. Request permission → iOS/Android dialog
3. If granted → Generate Expo Push Token
4. Save token to push_tokens table:
   {
     user_id: "abc-123",
     token: "ExponentPushToken[xyz]",
     platform: "ios",
     is_active: true,
     notification_settings: {
       weeklyOffers: true,
       eventReminders: true,
       pointsEarned: true,
       appUpdates: true
     }
   }
```

### 2. Token Management

**Automatic token deactivation:**
- When user logs in on new device → Old token marked `is_active: false`
- Only one active token per user/platform
- Prevents duplicate notifications

**Token lifecycle:**
```sql
New device login → INSERT new token → 
→ Trigger fires → UPDATE old tokens SET is_active = false
```

### 3. Notification Delivery Process

**Step-by-step delivery:**

```
1. Edge Function triggered (manual/cron/scheduled)
   ↓
2. Query active tokens with preferences
   SELECT * FROM push_tokens 
   WHERE is_active = true 
   AND notification_settings->>'weeklyOffers' = 'true'
   ↓
3. Batch tokens (max 100 per request)
   ↓
4. Send to Expo Push Service
   POST https://exp.host/--/api/v2/push/send
   ↓
5. Expo delivers to devices
   ↓
6. Save to notification_history
   ↓
7. User receives & taps → App opens to specific screen
```

---

## 🤖 Automated Notifications

### Weekly Offers System

**How it detects the active week:**

```sql
-- Your database structure:
angebotskalender_weeks:
┌──────────────┬────────────────┬───────────┐
│ week_number  │ week_theme     │ is_active │
├──────────────┼────────────────┼───────────┤
│ 1            │ Burger Woche   │ false     │
│ 2            │ Türkische      │ true ←──  │ Active!
│ 3            │ Boxen Woche    │ false     │
└──────────────┴────────────────┴───────────┘
```

**Automated Process (runs via schedule-notifications):**

```javascript
Every Sunday Night (via manual trigger or scheduled):
1. Check active week → week_number: 2, theme: "Türkische Woche"
2. Get items from angebotskalender_items for week_id
3. Count offers: 5 items found
4. Generate notification:
   Title: "🔥 Türkische Woche ist da!"
   Body: "5 neue Angebote warten auf Sie: Döner, Lahmacun..."
5. Schedule for Monday 10:00 AM German time
6. Insert into scheduled_notifications table
```

**Monday Morning (via cron):**
```javascript
10:00 AM: Cron runs → Finds scheduled notification → 
→ Sends to all users → Users see offers!
```

**Week Rotation:**
```sql
-- Manual rotation (run weekly)
SELECT rotate_to_next_week();

-- Or automatic by ISO week
SELECT update_active_week();  -- Uses EXTRACT(week FROM CURRENT_DATE)
```

### Event Reminders System

**How events are processed:**

```sql
-- Your events table:
events:
┌────────────┬──────────────────┬────────────┐
│ title      │ date             │ location   │
├────────────┼──────────────────┼────────────┤
│ Kieler W.  │ 2024-06-22       │ Hafen      │ ← Tomorrow
│ Sommerfest │ 2024-06-28       │ Restaurant │ ← Next week
└────────────┴──────────────────┴────────────┘
```

**Automated Process:**

```javascript
Daily Check (or manual trigger):
1. Query events in next 30 days
2. For each event:
   - Calculate: eventDate - 1 day at 18:00
   - Check if reminder already scheduled
   - If not, create reminder:
     Title: "📅 Event-Erinnerung!"
     Body: "Morgen: Kieler Woche im Hafen"
   - Schedule for day before at 18:00
```

**Important Notes:**
- **ALL events get reminders** (not just favorites)
- Favorites are only for user's personal list in app
- Everyone with `eventReminders: true` gets notified

### Cron Job Processing

**What happens every hour:**

```javascript
notification-cron runs every hour:

1. Query scheduled_notifications:
   WHERE sent = false 
   AND scheduled_for <= NOW()
   LIMIT 50

2. For each notification:
   a. Check age (skip if > 24 hours old)
   b. Call send-notification internally
   c. Update sent = true, sent_count = X
   d. Save errors if any

3. Cleanup old notifications (> 90 days)

4. Return statistics:
   {
     processed: 5,
     sent: 4,
     failed: 0,
     skipped: 1
   }
```

---

## 📨 Manual Notifications

### Admin Panel Usage

**Setup:**
1. Open `admin-notification-panel.html` in browser
2. Configure:
   - Supabase URL: `https://cicpnssrptuawxtmckiq.supabase.co`
   - Service Role Key: `eyJ...` (from Settings → API)

**Sending Notifications:**

```javascript
Manual Send:
1. Select target audience:
   - All Users → everyone with active tokens
   - Specific Users → enter user IDs
   - iOS Only → platform = 'ios'
   - Android Only → platform = 'android'

2. Enter content:
   Title: "🎉 Sonderangebot heute!"
   Body: "50% auf alle Burger bis 18 Uhr"
   Data: {"screen": "menu", "filter": "burgers"}

3. Click Send → Immediate delivery
```

**Scheduling Notifications:**

```javascript
Schedule for Later:
1. Enter notification details
2. Select date/time (e.g., Friday 17:00)
3. Click Schedule
4. Saved to scheduled_notifications
5. Cron will send at specified time
```

### Direct API Calls

**Send Immediate Notification:**

```bash
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/send-notification" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "title": "Special Offer",
    "body": "Limited time only!",
    "data": {
      "screen": "menu",
      "offerId": "special-123"
    },
    "target_audience": {
      "all": true
    }
  }'
```

**Schedule Weekly Offers:**

```bash
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/schedule-notifications" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly_offers"}'
```

---

## 🗄️ Database Architecture

### Table Relationships

```sql
auth.users (Supabase Auth)
    ↓ (1:1)
profiles (your user data)
    ↓ (1:1)
push_tokens (notification tokens)
    ↓ (1:many)
notification_history (sent notifications)

angebotskalender_weeks (8 rotating themes)
    ↓ (1:many)
angebotskalender_items (offers per week)
    ↓ (many:1)
menu_items (optional link to menu)

events (upcoming events)
    ↓ (triggers)
scheduled_notifications (future sends)
```

### Key Tables Explained

**push_tokens:**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  token TEXT UNIQUE,              -- ExponentPushToken[...]
  platform TEXT,                  -- ios/android
  is_active BOOLEAN DEFAULT true, -- Only one active per user
  notification_settings JSONB,    -- User preferences
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**scheduled_notifications:**
```sql
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY,
  type TEXT,                    -- weekly_offer/event_reminder/custom
  title TEXT,
  body TEXT,
  data JSONB,                   -- Navigation data
  scheduled_for TIMESTAMPTZ,    -- When to send
  target_audience JSONB,        -- Who gets it
  sent BOOLEAN DEFAULT false,
  sent_count INTEGER,           -- How many received
  sent_at TIMESTAMPTZ,         -- When actually sent
  error TEXT                    -- Any error messages
);
```

**notification_history:**
```sql
CREATE TABLE notification_history (
  id UUID PRIMARY KEY,
  user_id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,    -- User opened app
  clicked BOOLEAN DEFAULT false  -- User tapped notification
);
```

### RLS Security Policies

**What users can access:**
```sql
-- Users can only see their own tokens
CREATE POLICY "Users view own tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own history
CREATE POLICY "Users view own history" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view scheduled (transparency)
CREATE POLICY "Public scheduled view" ON scheduled_notifications
  FOR SELECT USING (true);
```

---

## 💰 Cost Analysis

### Supabase Edge Functions Pricing

**Free Tier (what you get):**
- 500,000 invocations/month
- 100GB-seconds compute time
- 100GB outbound data

**Your Usage:**

```
Cron runs:        24 × 30 = 720/month
Weekly offers:     4 × 1 = 4/month
Event reminders:  30 × 1 = 30/month (max)
Manual sends:     ~100/month (estimate)
─────────────────────────────────────
TOTAL:            854 invocations/month

You're using: 0.17% of free tier!
Monthly cost: €0.00
```

**When you'd start paying:**
```
To exceed free tier, you'd need:
- 694 notifications per hour, 24/7
- OR 16,666 manual sends per day
- OR 585,000+ active users

Realistic cost even with 10,000 users: €0/month
```

### Expo Push Notifications

**Always Free:**
- Unlimited push notifications
- No credit card required
- No limits on recipients

### External Cron Service

**cron-job.org (Recommended):**
- Free tier: 100 jobs
- You need: 1 job
- Cost: €0/month

**Alternative - Supabase pg_cron:**
- Included in Supabase
- No additional cost
- Requires SQL setup

---

## 🧪 Testing & Monitoring

### Testing Checklist

**1. Token Registration Test:**
```javascript
// In app:
1. Fresh install → Open app
2. Go to Settings → Notifications
3. Enable notifications
4. Check Supabase: SELECT * FROM push_tokens WHERE user_id = 'YOUR_ID'
5. Should see token with is_active = true
```

**2. Manual Send Test:**
```bash
# Quick test command:
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/send-notification" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"custom","title":"Test","body":"Working!","target_audience":{"all":true}}'
```

**3. Schedule Test:**
```sql
-- Schedule notification for 2 minutes from now:
INSERT INTO scheduled_notifications (
  type, title, body, 
  scheduled_for, target_audience
) VALUES (
  'custom', 
  'Scheduled Test', 
  'This was scheduled!',
  NOW() + INTERVAL '2 minutes',
  '{"all": true}'::jsonb
);

-- Then manually trigger cron:
-- POST to /notification-cron
```

**4. Weekly Offers Test:**
```sql
-- Set active week:
UPDATE angebotskalender_weeks SET is_active = false;
UPDATE angebotskalender_weeks SET is_active = true WHERE week_number = 1;

-- Run scheduling:
-- POST to /schedule-notifications with {"type": "weekly_offers"}

-- Check result:
SELECT * FROM scheduled_notifications WHERE type = 'weekly_offer' ORDER BY created_at DESC;
```

### Monitoring Tools

**1. Edge Function Logs:**
```
Supabase Dashboard → Edge Functions → [Function] → Logs
- Real-time execution logs
- Error tracking
- Performance metrics
```

**2. Database Monitoring:**
```sql
-- Check hourly cron performance:
SELECT 
  DATE_TRUNC('hour', sent_at) as hour,
  COUNT(*) as notifications_sent,
  AVG(sent_count) as avg_recipients
FROM scheduled_notifications
WHERE sent = true
GROUP BY hour
ORDER BY hour DESC;

-- Check delivery success rate:
SELECT 
  COUNT(*) FILTER (WHERE sent = true) as sent,
  COUNT(*) FILTER (WHERE error IS NOT NULL) as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sent = true) / COUNT(*), 2) as success_rate
FROM scheduled_notifications;

-- Monitor token health:
SELECT 
  platform,
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE is_active = true) as active_tokens
FROM push_tokens
GROUP BY platform;
```

**3. User Engagement:**
```sql
-- Check notification effectiveness:
SELECT 
  type,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE read = true) as read,
  COUNT(*) FILTER (WHERE clicked = true) as clicked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked = true) / COUNT(*), 2) as ctr
FROM notification_history
GROUP BY type;
```

### Performance Optimization

**1. Batch Processing:**
- Send max 100 tokens per Expo API call
- Process max 50 scheduled notifications per cron run
- Prevents timeouts and improves reliability

**2. Quiet Hours:**
- No notifications 21:00 - 11:00 German time
- Except custom/emergency notifications
- Respects user experience

**3. Token Cleanup:**
```sql
-- Run monthly to remove old inactive tokens:
DELETE FROM push_tokens 
WHERE is_active = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

**Issue: No notifications received**

Diagnostic steps:
```sql
-- 1. Check user has active token:
SELECT * FROM push_tokens WHERE user_id = 'USER_ID';

-- 2. Check notification was sent:
SELECT * FROM notification_history 
WHERE user_id = 'USER_ID' 
ORDER BY sent_at DESC;

-- 3. Check Edge Function logs:
-- Dashboard → Edge Functions → Logs
```

**Issue: Cron not running**

```bash
# Test cron manually:
curl -X POST "YOUR_URL/functions/v1/notification-cron" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return:
# {"success":true,"message":"Processed X notifications"}
```

**Issue: Weekly offers not scheduling**

```sql
-- Check active week exists:
SELECT * FROM angebotskalender_weeks WHERE is_active = true;

-- Check week has items:
SELECT COUNT(*) FROM angebotskalender_items 
WHERE week_id = (SELECT id FROM angebotskalender_weeks WHERE is_active = true);

-- Manually trigger scheduling:
-- POST to /schedule-notifications with {"type": "weekly_offers"}
```

**Issue: Duplicate notifications**

```sql
-- Check for multiple active tokens:
SELECT user_id, COUNT(*) 
FROM push_tokens 
WHERE is_active = true 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Fix by deactivating old tokens:
UPDATE push_tokens SET is_active = false 
WHERE user_id = 'USER_ID' 
AND created_at < (
  SELECT MAX(created_at) FROM push_tokens WHERE user_id = 'USER_ID'
);
```

### Debug Mode

**Enable verbose logging in Edge Functions:**

```javascript
// Add to your functions:
console.log('🔍 DEBUG:', {
  tokensFound: tokens.length,
  preferences: tokens[0]?.notification_settings,
  targetAudience: request.target_audience,
  scheduledFor: notification.scheduled_for
});
```

**Test with single user:**

```json
{
  "type": "custom",
  "title": "Debug Test",
  "body": "Testing single user",
  "target_audience": {
    "user_ids": ["YOUR_TEST_USER_ID"]
  }
}
```

---

## 🎯 Best Practices

### 1. Content Guidelines

**Titles (keep short):**
- ✅ "🔥 Burger Woche ist da!"
- ✅ "📅 Event morgen!"
- ❌ "Sehr geehrte Kunden, wir möchten Sie informieren..."

**Body (be specific):**
- ✅ "5 neue Angebote: Burger, Pommes, und mehr!"
- ✅ "Kieler Woche morgen um 18:00 im Hafen"
- ❌ "Neue Angebote verfügbar"

### 2. Timing Strategy

**Optimal send times:**
- Weekly offers: Monday 10:00 AM (start of week)
- Event reminders: Day before 18:00 (after work)
- Special offers: 11:30 AM (before lunch) or 17:00 (before dinner)

**Avoid:**
- Early morning (before 9:00)
- Late evening (after 21:00)
- Sunday (unless special event)

### 3. Targeting Best Practices

```javascript
// Good: Respect preferences
target_audience: {
  all: true  // System checks notification_settings automatically
}

// Better: Segment users
target_audience: {
  platform: 'ios'  // iOS users for app update
}

// Best: Specific targeting
target_audience: {
  user_ids: ['premium-user-1', 'premium-user-2']  // VIP offers
}
```

### 4. Testing Protocol

Before going live:
1. Test with your own device first
2. Test with 2-3 team members
3. Send to small group (10 users)
4. Monitor feedback
5. Roll out to all users

---

## 📊 Success Metrics

Track these KPIs:

```sql
-- Daily notification metrics:
CREATE VIEW notification_metrics AS
SELECT 
  DATE(sent_at) as date,
  type,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE read = true) as opened,
  COUNT(*) FILTER (WHERE clicked = true) as clicked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked = true) / COUNT(*), 2) as ctr,
  ROUND(AVG(EXTRACT(EPOCH FROM (read_at - sent_at))/60), 2) as avg_open_time_minutes
FROM notification_history
GROUP BY DATE(sent_at), type;
```

**Target Metrics:**
- Delivery Rate: > 95%
- Open Rate: > 30%
- Click Rate: > 10%
- Opt-out Rate: < 5%

---

## 🚀 Future Enhancements

### Potential Improvements

1. **A/B Testing:**
   - Test different titles/times
   - Measure engagement

2. **Personalization:**
   - Based on order history
   - Favorite menu items

3. **Rich Notifications:**
   - Images in notifications
   - Action buttons

4. **Analytics Dashboard:**
   - Real-time metrics
   - User segments
   - Campaign performance

5. **Multi-language:**
   - German/English based on user preference
   - Auto-detect from device

---

## 📝 Summary

Your push notification system is:
- ✅ **Fully automated** (weekly offers, events)
- ✅ **User-respectful** (preferences, quiet hours)
- ✅ **Cost-effective** (€0/month)
- ✅ **Scalable** (handles 500K notifications/month free)
- ✅ **Secure** (RLS policies)
- ✅ **Monitored** (logs, metrics)
- ✅ **Production-ready**

The system handles everything from user registration to automated marketing campaigns, with full admin control and detailed analytics. It's a professional-grade solution that will grow with your business!

---

**Last Updated:** January 2025
**Version:** 1.0
**Maintained by:** Grill-Partner Maier Development Team