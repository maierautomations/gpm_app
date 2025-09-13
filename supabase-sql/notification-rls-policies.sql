-- =====================================================
-- PUSH NOTIFICATIONS - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- CRITICAL SECURITY UPDATE: Enable RLS on notification tables
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- Enable RLS on all notification tables
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;  
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUSH_TOKENS POLICIES
-- =====================================================
-- Users can only manage their own push tokens

-- Policy: Users can view their own push tokens
CREATE POLICY "Users can view own push tokens" ON push_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own push tokens  
CREATE POLICY "Users can insert own push tokens" ON push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own push tokens
CREATE POLICY "Users can update own push tokens" ON push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own push tokens
CREATE POLICY "Users can delete own push tokens" ON push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role can manage all push tokens (for backend functions)
CREATE POLICY "Service role can manage all push tokens" ON push_tokens
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- NOTIFICATION_HISTORY POLICIES  
-- =====================================================
-- Users can only see their own notification history

-- Policy: Users can view their own notification history
CREATE POLICY "Users can view own notification history" ON notification_history
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update read/clicked status on their own notifications
CREATE POLICY "Users can update own notification status" ON notification_history
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert notifications for any user (backend sending)
CREATE POLICY "Service role can insert notifications" ON notification_history
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Service role can manage all notifications (for analytics)
CREATE POLICY "Service role can manage all notifications" ON notification_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SCHEDULED_NOTIFICATIONS POLICIES
-- =====================================================
-- Admin-only table for scheduling future notifications

-- Policy: Anyone can read scheduled notifications (for transparency)
CREATE POLICY "Anyone can view scheduled notifications" ON scheduled_notifications
    FOR SELECT USING (true);

-- Policy: Only service role can manage scheduled notifications
CREATE POLICY "Service role can manage scheduled notifications" ON scheduled_notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Add indexes for better query performance

-- Index for push token lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;

-- Index for notification history queries
CREATE INDEX IF NOT EXISTS idx_notification_history_user_date ON notification_history(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(user_id, read) WHERE read = false;

-- Index for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_type ON scheduled_notifications(type);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(user_uuid UUID)
RETURNS TABLE(token TEXT, platform TEXT, notification_settings JSONB)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT pt.token, pt.platform, pt.notification_settings
  FROM push_tokens pt
  WHERE pt.user_id = user_uuid 
    AND pt.is_active = true;
$$;

-- Function to get users who want a specific notification type
CREATE OR REPLACE FUNCTION get_users_for_notification_type(notification_type TEXT)
RETURNS TABLE(user_id UUID, token TEXT, platform TEXT)
LANGUAGE SQL  
SECURITY DEFINER
AS $$
  SELECT pt.user_id, pt.token, pt.platform
  FROM push_tokens pt
  WHERE pt.is_active = true
    AND (pt.notification_settings ->> CASE 
      WHEN notification_type = 'weekly_offer' THEN 'weeklyOffers'
      WHEN notification_type = 'event_reminder' THEN 'eventReminders'  
      WHEN notification_type = 'points_earned' THEN 'pointsEarned'
      WHEN notification_type = 'app_update' THEN 'appUpdates'
      ELSE 'weeklyOffers'
    END)::boolean = true;
$$;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_scheduled_notification_sent(notification_id UUID, sent_count INTEGER DEFAULT 0)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER  
AS $$
  UPDATE scheduled_notifications 
  SET sent = true, sent_count = mark_scheduled_notification_sent.sent_count
  WHERE id = notification_id;
  
  SELECT FOUND;
$$;

-- Function to cleanup old notifications (run monthly) worked
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH deleted AS (
    DELETE FROM notification_history 
    WHERE sent_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) FROM deleted;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to push_tokens table
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at 
    BEFORE UPDATE ON push_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify RLS is working properly

-- Check RLS status (should all be true)
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('push_tokens', 'notification_history', 'scheduled_notifications');

-- Test RLS as a regular user (replace with real user ID)
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub":"USER_ID_HERE","role":"authenticated"}';
-- SELECT * FROM push_tokens; -- Should only show user's own tokens
-- RESET ROLE;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Ensure proper permissions for authenticated users and service role

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON push_tokens TO authenticated;
GRANT SELECT, UPDATE ON notification_history TO authenticated;  
GRANT SELECT ON scheduled_notifications TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON push_tokens TO service_role;
GRANT ALL ON notification_history TO service_role;
GRANT ALL ON scheduled_notifications TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_push_tokens(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_users_for_notification_type(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION mark_scheduled_notification_sent(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Push notification RLS policies have been successfully applied!';
    RAISE NOTICE '📱 Tables secured: push_tokens, notification_history, scheduled_notifications';
    RAISE NOTICE '🔒 Users can now only access their own notification data';
    RAISE NOTICE '⚡ Performance indexes added for faster queries';
    RAISE NOTICE '🛠️ Utility functions created for backend operations';
END $$;