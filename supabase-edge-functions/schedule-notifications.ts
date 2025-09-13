// =====================================================
// SCHEDULE NOTIFICATIONS EDGE FUNCTION
// =====================================================
// Handles automated scheduling of weekly offers and event reminders
// Deploy: supabase functions deploy schedule-notifications
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface ScheduleRequest {
  type: 'weekly_offers' | 'event_reminders' | 'custom'
  schedule_time?: string // ISO string for custom scheduling
  custom_notification?: {
    title: string
    body: string
    data?: any
    target_audience?: any
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const scheduleRequest: ScheduleRequest = await req.json()

    console.log('📅 Processing schedule request:', scheduleRequest.type)

    let scheduledCount = 0

    switch (scheduleRequest.type) {
      case 'weekly_offers':
        scheduledCount = await scheduleWeeklyOffers(supabase)
        break
      case 'event_reminders':
        scheduledCount = await scheduleEventReminders(supabase)
        break
      case 'custom':
        if (!scheduleRequest.custom_notification || !scheduleRequest.schedule_time) {
          throw new Error('Custom notifications require notification details and schedule_time')
        }
        scheduledCount = await scheduleCustomNotification(
          supabase, 
          scheduleRequest.custom_notification,
          scheduleRequest.schedule_time
        )
        break
      default:
        throw new Error('Invalid schedule type')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled ${scheduledCount} notifications`,
        type: scheduleRequest.type,
        scheduled_count: scheduledCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in schedule-notifications function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// WEEKLY OFFERS SCHEDULING
// =====================================================

async function scheduleWeeklyOffers(supabase: any): Promise<number> {
  try {
    // Get current active week
    const { data: activeWeek, error: weekError } = await supabase
      .from('angebotskalender_weeks')
      .select('*')
      .eq('is_active', true)
      .single()

    if (weekError || !activeWeek) {
      console.log('⚠️ No active week found, skipping weekly offers')
      return 0
    }

    // Get offers for this week
    const { data: weeklyItems, error: itemsError } = await supabase
      .from('angebotskalender_items')
      .select(`
        *,
        menu_items (name, description)
      `)
      .eq('week_id', activeWeek.id)
      .limit(5) // Get top 5 offers

    if (itemsError) {
      throw new Error(`Failed to fetch weekly items: ${itemsError.message}`)
    }

    if (!weeklyItems || weeklyItems.length === 0) {
      console.log('⚠️ No items found for current week, skipping')
      return 0
    }

    // Calculate next Monday 10 AM German time
    const now = new Date()
    const nextMonday = getNextMonday()
    nextMonday.setHours(10, 0, 0, 0) // 10:00 AM

    // Convert to German timezone
    const germanTime = new Date(nextMonday.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))

    // Don't schedule if it's too close (less than 1 hour from now)
    if (germanTime.getTime() - now.getTime() < 60 * 60 * 1000) {
      console.log('⏰ Next Monday is too close, skipping scheduling')
      return 0
    }

    // Check if notification already scheduled for this week/time
    const { data: existingScheduled } = await supabase
      .from('scheduled_notifications')
      .select('id')
      .eq('type', 'weekly_offer')
      .eq('sent', false)
      .gte('scheduled_for', new Date(germanTime.getTime() - 60 * 60 * 1000).toISOString()) // Within 1 hour
      .lte('scheduled_for', new Date(germanTime.getTime() + 60 * 60 * 1000).toISOString())

    if (existingScheduled && existingScheduled.length > 0) {
      console.log('✅ Weekly offer notification already scheduled')
      return 0
    }

    // Create attractive notification content
    const offerCount = weeklyItems.length
    const themeName = activeWeek.week_theme
    
    // Get sample items for the body text
    const sampleItems = weeklyItems
      .slice(0, 3)
      .map(item => {
        if (item.menu_items) {
          return item.menu_items.name
        } else {
          return item.custom_name
        }
      })
      .filter(Boolean)

    const title = `🔥 ${themeName} ist da!`
    const body = offerCount > 1 
      ? `${offerCount} neue Angebote warten auf Sie: ${sampleItems.join(', ')} und mehr!`
      : `Neues Angebot: ${sampleItems[0] || 'Spezielle Rabatte'} - Jetzt entdecken!`

    // Schedule the notification
    const { error: scheduleError } = await supabase
      .from('scheduled_notifications')
      .insert({
        type: 'weekly_offer',
        title: title,
        body: body,
        data: {
          week_id: activeWeek.id,
          week_theme: activeWeek.week_theme,
          screen: 'menu',
          filter: 'offers',
          item_count: offerCount
        },
        scheduled_for: germanTime.toISOString(),
        target_audience: { all: true },
        sent: false
      })

    if (scheduleError) {
      throw new Error(`Failed to schedule notification: ${scheduleError.message}`)
    }

    console.log(`✅ Scheduled weekly offer notification for ${germanTime.toISOString()}`)
    return 1

  } catch (error) {
    console.error('❌ Error scheduling weekly offers:', error)
    throw error
  }
}

// =====================================================
// EVENT REMINDERS SCHEDULING
// =====================================================

async function scheduleEventReminders(supabase: any): Promise<number> {
  try {
    // Get upcoming events (next 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('date', now.toISOString().split('T')[0]) // Today or later
      .lte('date', thirtyDaysFromNow.toISOString().split('T')[0]) // Within 30 days
      .order('date', { ascending: true })

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`)
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log('📅 No upcoming events found')
      return 0
    }

    let scheduledCount = 0

    for (const event of upcomingEvents) {
      try {
        // Calculate reminder time (day before at 18:00 German time)
        const eventDate = new Date(event.date + 'T00:00:00')
        const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) // Day before
        reminderDate.setHours(18, 0, 0, 0) // 18:00 (6 PM)

        // Convert to German timezone
        const germanReminderTime = new Date(reminderDate.toLocaleString("en-US", {timeZone: "Europe/Berlin"}))

        // Skip if reminder time has already passed
        if (germanReminderTime.getTime() <= now.getTime()) {
          console.log(`⏭️ Skipping past event: ${event.title}`)
          continue
        }

        // Check if reminder already scheduled for this event
        const { data: existingReminder } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('type', 'event_reminder')
          .eq('sent', false)
          .contains('data', { event_id: event.id })

        if (existingReminder && existingReminder.length > 0) {
          console.log(`✅ Reminder already scheduled for event: ${event.title}`)
          continue
        }

        // Create reminder content
        const eventDateFormatted = eventDate.toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',  
          day: 'numeric'
        })

        const title = '📅 Event-Erinnerung!'
        const body = `Morgen ist es soweit: "${event.title}" am ${eventDateFormatted}${event.location ? ` in ${event.location}` : ''}. Wir freuen uns auf Sie!`

        // Schedule the reminder
        const { error: scheduleError } = await supabase
          .from('scheduled_notifications')
          .insert({
            type: 'event_reminder',
            title: title,
            body: body,
            data: {
              event_id: event.id,
              event_title: event.title,
              event_date: event.date,
              event_location: event.location,
              screen: 'events'
            },
            scheduled_for: germanReminderTime.toISOString(),
            target_audience: { all: true },
            sent: false
          })

        if (scheduleError) {
          console.error(`❌ Failed to schedule reminder for event ${event.title}:`, scheduleError)
          continue
        }

        console.log(`✅ Scheduled reminder for event "${event.title}" at ${germanReminderTime.toISOString()}`)
        scheduledCount++

      } catch (eventError) {
        console.error(`❌ Error processing event ${event.title}:`, eventError)
        continue
      }
    }

    return scheduledCount

  } catch (error) {
    console.error('❌ Error scheduling event reminders:', error)
    throw error
  }
}

// =====================================================
// CUSTOM NOTIFICATION SCHEDULING
// =====================================================

async function scheduleCustomNotification(
  supabase: any, 
  notification: any, 
  scheduleTime: string
): Promise<number> {
  try {
    const scheduledDate = new Date(scheduleTime)
    
    // Validate schedule time is in the future
    if (scheduledDate.getTime() <= Date.now()) {
      throw new Error('Schedule time must be in the future')
    }

    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        type: 'custom',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        scheduled_for: scheduledDate.toISOString(),
        target_audience: notification.target_audience || { all: true },
        sent: false
      })

    if (error) {
      throw new Error(`Failed to schedule custom notification: ${error.message}`)
    }

    console.log(`✅ Scheduled custom notification for ${scheduledDate.toISOString()}`)
    return 1

  } catch (error) {
    console.error('❌ Error scheduling custom notification:', error)
    throw error
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function getNextMonday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
  
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  
  return nextMonday
}

// =====================================================
// USAGE EXAMPLES
// =====================================================
/*

1. Schedule weekly offers notification:
POST /functions/v1/schedule-notifications
{
  "type": "weekly_offers"
}

2. Schedule event reminders:
POST /functions/v1/schedule-notifications
{
  "type": "event_reminders"
}

3. Schedule custom notification:
POST /functions/v1/schedule-notifications
{
  "type": "custom",
  "schedule_time": "2024-01-15T10:00:00Z",
  "custom_notification": {
    "title": "Wichtige Mitteilung",
    "body": "Das Restaurant ist heute bis 22:00 geöffnet!",
    "data": { "screen": "home" },
    "target_audience": { "all": true }
  }
}

4. Schedule notification for specific users:
POST /functions/v1/schedule-notifications
{
  "type": "custom",
  "schedule_time": "2024-01-20T14:30:00Z",
  "custom_notification": {
    "title": "VIP Angebot",
    "body": "Exklusiv für unsere Stammkunden: 30% Rabatt!",
    "target_audience": {
      "user_ids": ["user-id-1", "user-id-2"]
    }
  }
}

*/