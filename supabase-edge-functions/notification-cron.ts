// =====================================================
// NOTIFICATION CRON EDGE FUNCTION
// =====================================================
// Processes scheduled notifications and sends them when due
// Deploy: supabase functions deploy notification-cron
// Setup cron: pg_cron extension with hourly trigger
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface ScheduledNotification {
  id: string
  type: string
  title: string
  body: string
  data: any
  scheduled_for: string
  target_audience: any
  sent: boolean
  sent_count?: number
}

interface ProcessingResult {
  processed: number
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log('🔄 Starting notification cron job...')

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process scheduled notifications
    const result = await processScheduledNotifications(supabase)

    const executionTime = Date.now() - startTime

    console.log(`✅ Cron job completed in ${executionTime}ms:`, {
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped
    })

    // Return detailed results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${result.processed} scheduled notifications`,
        execution_time_ms: executionTime,
        results: result,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in notification-cron function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// MAIN PROCESSING FUNCTION
// =====================================================

async function processScheduledNotifications(supabase: any): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  try {
    // Get notifications that are due (scheduled_for <= now AND not sent)
    const now = new Date()
    const { data: dueNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50) // Process max 50 notifications per run

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled notifications: ${fetchError.message}`)
    }

    if (!dueNotifications || dueNotifications.length === 0) {
      console.log('📭 No due notifications found')
      return result
    }

    console.log(`📬 Found ${dueNotifications.length} due notifications`)

    // Process each notification
    for (const notification of dueNotifications) {
      try {
        result.processed++
        console.log(`📤 Processing notification: ${notification.title}`)

        // Check if notification is still valid (not too old)
        const scheduledTime = new Date(notification.scheduled_for).getTime()
        const hoursSinceScheduled = (now.getTime() - scheduledTime) / (1000 * 60 * 60)
        
        if (hoursSinceScheduled > 24) {
          // Skip notifications older than 24 hours
          console.log(`⏭️ Skipping old notification (${Math.round(hoursSinceScheduled)}h old): ${notification.title}`)
          
          await markNotificationAsSkipped(supabase, notification.id, 'Too old to send')
          result.skipped++
          continue
        }

        // Validate notification has required fields
        if (!notification.title || !notification.body) {
          console.log(`⚠️ Skipping invalid notification: missing title or body`)
          await markNotificationAsSkipped(supabase, notification.id, 'Invalid notification data')
          result.skipped++
          continue
        }

        // Send the notification
        const sendResult = await sendScheduledNotification(supabase, notification)
        
        if (sendResult.success) {
          // Mark as sent with success count
          await markNotificationAsSent(supabase, notification.id, sendResult.sent_count || 0)
          result.sent++
          console.log(`✅ Successfully sent notification: ${notification.title} (${sendResult.sent_count} recipients)`)
        } else {
          // Mark as failed
          await markNotificationAsFailed(supabase, notification.id, sendResult.error || 'Unknown error')
          result.failed++
          result.errors.push(`${notification.title}: ${sendResult.error}`)
          console.log(`❌ Failed to send notification: ${notification.title}`)
        }

      } catch (notificationError) {
        result.failed++
        const errorMessage = `Error processing notification ${notification.id}: ${notificationError.message}`
        result.errors.push(errorMessage)
        console.error(`❌ ${errorMessage}`)
        
        // Try to mark as failed
        try {
          await markNotificationAsFailed(supabase, notification.id, notificationError.message)
        } catch (markError) {
          console.error(`❌ Failed to mark notification as failed: ${markError.message}`)
        }
      }
    }

    // Cleanup old notifications (optional)
    await cleanupOldNotifications(supabase)

  } catch (error) {
    console.error('❌ Error in processScheduledNotifications:', error)
    throw error
  }

  return result
}

// =====================================================
// NOTIFICATION SENDING
// =====================================================

async function sendScheduledNotification(
  supabase: any, 
  notification: ScheduledNotification
): Promise<{success: boolean, sent_count?: number, error?: string}> {
  try {
    // Prepare notification request for send-notification function
    const notificationRequest = {
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      target_audience: notification.target_audience || { all: true }
    }

    // Call the send-notification function directly (internal call)
    const sendNotificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    const response = await fetch(sendNotificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify(notificationRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Send notification API failed: ${response.status} - ${errorText}`)
    }

    const sendResult = await response.json()
    
    if (sendResult.success) {
      return {
        success: true,
        sent_count: sendResult.sent_count || 0
      }
    } else {
      return {
        success: false,
        error: sendResult.error || 'Unknown send error'
      }
    }

  } catch (error) {
    console.error(`❌ Error sending scheduled notification:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

// =====================================================
// DATABASE UPDATE FUNCTIONS
// =====================================================

async function markNotificationAsSent(supabase: any, notificationId: string, sentCount: number): Promise<void> {
  const { error } = await supabase
    .from('scheduled_notifications')
    .update({
      sent: true,
      sent_count: sentCount,
      sent_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error(`⚠️ Failed to mark notification ${notificationId} as sent:`, error)
  }
}

async function markNotificationAsFailed(supabase: any, notificationId: string, errorMessage: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_notifications')
    .update({
      sent: true, // Mark as sent to prevent retry
      sent_count: 0,
      error: errorMessage,
      sent_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error(`⚠️ Failed to mark notification ${notificationId} as failed:`, error)
  }
}

async function markNotificationAsSkipped(supabase: any, notificationId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_notifications')
    .update({
      sent: true, // Mark as sent to prevent retry
      sent_count: 0,
      error: `Skipped: ${reason}`,
      sent_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error(`⚠️ Failed to mark notification ${notificationId} as skipped:`, error)
  }
}

// =====================================================
// CLEANUP FUNCTIONS
// =====================================================

async function cleanupOldNotifications(supabase: any): Promise<void> {
  try {
    // Delete notifications older than 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('sent', true)
      .lt('sent_at', ninetyDaysAgo.toISOString())

    if (error) {
      console.error('⚠️ Failed to cleanup old notifications:', error)
    } else {
      console.log('🧹 Cleaned up old scheduled notifications')
    }
  } catch (error) {
    console.error('⚠️ Error during cleanup:', error)
  }
}

// =====================================================
// CRON SETUP INSTRUCTIONS
// =====================================================
/*

To set up the cron job in Supabase, run this SQL in the SQL Editor:

-- Enable pg_cron extension (run as postgres user)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run every hour
SELECT cron.schedule(
  'process-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
    SELECT
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/notification-cron',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
        ),
        body := jsonb_build_object()
      ) AS request_id;
  $$
);

-- View scheduled cron jobs
SELECT * FROM cron.job;

-- Remove a cron job (if needed)
-- SELECT cron.unschedule('process-notifications');

Alternative: Use GitHub Actions or similar CI/CD to trigger this function on a schedule

*/

// =====================================================
// MANUAL TESTING
// =====================================================
/*

You can manually trigger this function to test:

curl -X POST "https://your-project.supabase.co/functions/v1/notification-cron" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

*/