// =====================================================
// SEND NOTIFICATION EDGE FUNCTION
// =====================================================
// Deploy this function to Supabase Edge Functions
// Command: supabase functions deploy send-notification
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts" // You'll need to create this shared file

// Types
interface NotificationRequest {
  type: 'weekly_offer' | 'event_reminder' | 'points_earned' | 'app_update' | 'custom'
  title: string
  body: string
  data?: any
  image_url?: string
  target_audience?: {
    all?: boolean
    user_ids?: string[]
    notification_type?: string
    platform?: 'ios' | 'android'
  }
  badge?: number
  sound?: string
}

interface PushToken {
  user_id: string
  token: string
  platform: string
  notification_settings: any
}

interface PushMessage {
  to: string
  sound?: string
  title: string
  body: string
  data?: any
  badge?: number
  channelId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const notificationRequest: NotificationRequest = await req.json()

    console.log('📱 Processing notification request:', {
      type: notificationRequest.type,
      title: notificationRequest.title,
      target: notificationRequest.target_audience
    })

    // Validate request
    if (!notificationRequest.title || !notificationRequest.body) {
      throw new Error('Title and body are required')
    }

    // Get target push tokens based on audience
    const pushTokens = await getTargetPushTokens(supabase, notificationRequest)

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users match target audience or have this notification type enabled',
          sent_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🎯 Found ${pushTokens.length} users to notify`)

    // Send push notifications
    const results = await sendPushNotifications(pushTokens, notificationRequest)

    // Save to notification history
    await saveNotificationHistory(supabase, results, notificationRequest)

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`✅ Sent: ${successCount}, ❌ Failed: ${failureCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${successCount} users`,
        sent_count: successCount,
        failed_count: failureCount,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-notification function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getTargetPushTokens(supabase: any, request: NotificationRequest): Promise<PushToken[]> {
  let query = supabase
    .from('push_tokens')
    .select('user_id, token, platform, notification_settings')
    .eq('is_active', true)

  // Apply platform filter if specified
  if (request.target_audience?.platform) {
    query = query.eq('platform', request.target_audience.platform)
  }

  // Apply user ID filter if specified
  if (request.target_audience?.user_ids && request.target_audience.user_ids.length > 0) {
    query = query.in('user_id', request.target_audience.user_ids)
  }

  const { data: tokens, error } = await query

  if (error) {
    throw new Error(`Failed to fetch push tokens: ${error.message}`)
  }

  if (!tokens) {
    return []
  }

  // Filter by notification preferences
  const filteredTokens = tokens.filter((token: PushToken) => {
    if (!token.notification_settings) {
      return true // Default to allowing notifications if no settings
    }

    // Check if user has enabled this notification type
    switch (request.type) {
      case 'weekly_offer':
        return token.notification_settings.weeklyOffers === true
      case 'event_reminder':
        return token.notification_settings.eventReminders === true
      case 'points_earned':
        return token.notification_settings.pointsEarned === true
      case 'app_update':
        return token.notification_settings.appUpdates === true
      case 'custom':
        return true // Always send custom notifications
      default:
        return true
    }
  })

  console.log(`🔍 Filtered ${tokens.length} tokens to ${filteredTokens.length} based on preferences`)

  return filteredTokens
}

async function sendPushNotifications(
  pushTokens: PushToken[], 
  request: NotificationRequest
): Promise<Array<{user_id: string, token: string, success: boolean, error?: string}>> {
  const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
  const results: Array<{user_id: string, token: string, success: boolean, error?: string}> = []

  // Check if we're within quiet hours (21:00 - 11:00 German time)
  const now = new Date()
  const germanTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))
  const hour = germanTime.getHours()
  
  // Skip sending if in quiet hours (unless it's an emergency/custom notification)
  if ((hour >= 21 || hour < 11) && request.type !== 'custom') {
    console.log(`🔇 Skipping notification due to quiet hours (${hour}:00 German time)`)
    return pushTokens.map(token => ({
      user_id: token.user_id,
      token: token.token,
      success: false,
      error: 'Skipped due to quiet hours'
    }))
  }

  // Prepare push messages
  const messages: PushMessage[] = pushTokens.map(token => ({
    to: token.token,
    sound: request.sound || 'default',
    title: request.title,
    body: request.body,
    data: {
      ...request.data,
      type: request.type,
      userId: token.user_id,
      timestamp: new Date().toISOString()
    },
    badge: request.badge,
    channelId: token.platform === 'android' ? 'default' : undefined
  }))

  // Send in batches of 100 (Expo's limit)
  const batchSize = 100
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })

      if (!response.ok) {
        throw new Error(`Push service responded with ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      // Process batch results
      batch.forEach((message, index) => {
        const pushToken = pushTokens[i + index]
        const result = responseData.data ? responseData.data[index] : responseData
        
        if (result.status === 'ok') {
          results.push({
            user_id: pushToken.user_id,
            token: pushToken.token,
            success: true
          })
        } else {
          results.push({
            user_id: pushToken.user_id,
            token: pushToken.token,
            success: false,
            error: result.message || result.details?.error || 'Unknown push service error'
          })
        }
      })

    } catch (error) {
      console.error(`❌ Failed to send batch ${Math.floor(i/batchSize) + 1}:`, error)
      
      // Mark entire batch as failed
      batch.forEach((message, index) => {
        const pushToken = pushTokens[i + index]
        results.push({
          user_id: pushToken.user_id,
          token: pushToken.token,
          success: false,
          error: error.message
        })
      })
    }
  }

  return results
}

async function saveNotificationHistory(
  supabase: any, 
  results: Array<{user_id: string, token: string, success: boolean, error?: string}>, 
  request: NotificationRequest
): Promise<void> {
  try {
    // Save successful notifications to history
    const successfulNotifications = results
      .filter(result => result.success)
      .map(result => ({
        user_id: result.user_id,
        type: request.type,
        title: request.title,
        body: request.body,
        data: request.data || {},
        sent_at: new Date().toISOString(),
        read: false,
        clicked: false
      }))

    if (successfulNotifications.length > 0) {
      const { error } = await supabase
        .from('notification_history')
        .insert(successfulNotifications)

      if (error) {
        console.error('⚠️  Failed to save notification history:', error)
        // Don't throw - this is not critical for the notification sending
      } else {
        console.log(`💾 Saved ${successfulNotifications.length} notifications to history`)
      }
    }

    // Log failed notifications for debugging
    const failedNotifications = results.filter(result => !result.success)
    if (failedNotifications.length > 0) {
      console.error('❌ Failed notifications:', failedNotifications)
      
      // Optionally save failed notifications to a separate table for debugging
      // You could create a 'failed_notifications' table for this
    }

  } catch (error) {
    console.error('❌ Error saving notification history:', error)
    // Don't throw - history saving is not critical
  }
}

// =====================================================
// USAGE EXAMPLES
// =====================================================
/*

1. Send to all users who have weekly offers enabled:
POST /functions/v1/send-notification
{
  "type": "weekly_offer",
  "title": "🔥 Neue Wochenangebote!",
  "body": "Burger Woche ist da! Jetzt 20% sparen auf alle Burger.",
  "data": { "screen": "menu", "filter": "offers" },
  "target_audience": { "all": true }
}

2. Send to specific users:
POST /functions/v1/send-notification
{
  "type": "custom", 
  "title": "Persönliche Nachricht",
  "body": "Ihr Lieblingsburger ist wieder da!",
  "target_audience": { 
    "user_ids": ["user-id-1", "user-id-2"] 
  }
}

3. Send event reminder:
POST /functions/v1/send-notification
{
  "type": "event_reminder",
  "title": "Event morgen! 📅",
  "body": "Kieler Woche Event startet morgen um 18:00 Uhr",
  "data": { "event_id": "123", "screen": "events" },
  "target_audience": { "all": true }
}

4. iOS only notification:
POST /functions/v1/send-notification
{
  "type": "app_update",
  "title": "App Update verfügbar",
  "body": "Neue Features und Verbesserungen warten auf Sie!",
  "target_audience": { "platform": "ios" }
}

*/