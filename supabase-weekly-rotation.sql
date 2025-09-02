-- Automatic Weekly Rotation for Angebotskalender
-- This script creates a function to rotate active weeks automatically

-- Create function to update active week based on current date
CREATE OR REPLACE FUNCTION update_active_week()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_week_number integer;
    target_week_number integer;
BEGIN
    -- Calculate which week should be active (1-8 rotation)
    -- Using ISO week number modulo 8, but we want weeks 1-8 not 0-7
    current_week_number := EXTRACT(week FROM NOW());
    target_week_number := ((current_week_number - 1) % 8) + 1;
    
    -- Handle the special case where we only have weeks 1-7 currently
    -- Week 8 (Hähnchen Woche) will be active every 8th week
    -- For now, map week 8 to week 1 until all weeks are ready
    IF target_week_number = 8 THEN
        target_week_number := 8; -- Keep week 8 as Hähnchen Woche
    END IF;
    
    -- Deactivate all weeks first
    UPDATE angebotskalender_weeks 
    SET is_active = false;
    
    -- Activate the target week
    UPDATE angebotskalender_weeks 
    SET 
        is_active = true,
        start_date = CURRENT_DATE,
        end_date = CURRENT_DATE + INTERVAL '7 days'
    WHERE week_number = target_week_number;
    
    -- Log the change (optional, for debugging)
    RAISE NOTICE 'Activated week % (ISO week: %)', target_week_number, current_week_number;
END;
$$;

-- Create a trigger to run weekly rotation
-- Note: This requires pg_cron extension or manual execution
-- For now, create a manual execution function

-- Function to manually rotate to next week (for testing/manual control)
CREATE OR REPLACE FUNCTION rotate_to_next_week()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    current_active_week integer;
    next_week integer;
    theme_name text;
BEGIN
    -- Get currently active week
    SELECT week_number INTO current_active_week 
    FROM angebotskalender_weeks 
    WHERE is_active = true;
    
    -- Calculate next week (1-8 rotation)
    next_week := CASE 
        WHEN current_active_week >= 8 THEN 1 
        ELSE current_active_week + 1 
    END;
    
    -- Deactivate current week
    UPDATE angebotskalender_weeks 
    SET is_active = false 
    WHERE is_active = true;
    
    -- Activate next week
    UPDATE angebotskalender_weeks 
    SET 
        is_active = true,
        start_date = CURRENT_DATE,
        end_date = CURRENT_DATE + INTERVAL '7 days'
    WHERE week_number = next_week;
    
    -- Get the theme name for return message
    SELECT week_theme INTO theme_name 
    FROM angebotskalender_weeks 
    WHERE week_number = next_week;
    
    RETURN 'Rotated to week ' || next_week || ': ' || theme_name;
END;
$$;

-- Function to set specific week as active (for manual control)
CREATE OR REPLACE FUNCTION set_active_week(target_week_num integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    theme_name text;
BEGIN
    -- Validate week number
    IF target_week_num < 1 OR target_week_num > 8 THEN
        RETURN 'Error: Week number must be between 1 and 8';
    END IF;
    
    -- Check if week exists
    IF NOT EXISTS (SELECT 1 FROM angebotskalender_weeks WHERE week_number = target_week_num) THEN
        RETURN 'Error: Week ' || target_week_num || ' does not exist';
    END IF;
    
    -- Deactivate all weeks
    UPDATE angebotskalender_weeks 
    SET is_active = false;
    
    -- Activate target week
    UPDATE angebotskalender_weeks 
    SET 
        is_active = true,
        start_date = CURRENT_DATE,
        end_date = CURRENT_DATE + INTERVAL '7 days'
    WHERE week_number = target_week_num;
    
    -- Get theme name
    SELECT week_theme INTO theme_name 
    FROM angebotskalender_weeks 
    WHERE week_number = target_week_num;
    
    RETURN 'Activated week ' || target_week_num || ': ' || theme_name;
END;
$$;

-- Function to get rotation schedule for next 8 weeks
CREATE OR REPLACE FUNCTION get_rotation_schedule()
RETURNS TABLE(
    week_start_date date,
    week_number integer,
    week_theme text,
    is_current_active boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_active_week integer;
    i integer;
    week_num integer;
BEGIN
    -- Get currently active week
    SELECT angebotskalender_weeks.week_number INTO current_active_week 
    FROM angebotskalender_weeks 
    WHERE is_active = true;
    
    -- Generate schedule for next 8 weeks
    FOR i IN 0..7 LOOP
        week_num := ((current_active_week + i - 1) % 8) + 1;
        
        SELECT 
            CURRENT_DATE + (i * INTERVAL '7 days'),
            week_num,
            aw.week_theme,
            (i = 0)
        INTO 
            week_start_date,
            week_number,
            week_theme,
            is_current_active
        FROM angebotskalender_weeks aw
        WHERE aw.week_number = week_num;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Usage Examples:
-- SELECT update_active_week();                    -- Auto-rotate based on calendar week
-- SELECT rotate_to_next_week();                   -- Manually rotate to next week  
-- SELECT set_active_week(3);                      -- Set specific week (1-8) as active
-- SELECT * FROM get_rotation_schedule();          -- View upcoming rotation schedule

-- For automatic execution, you would need to set up pg_cron:
-- SELECT cron.schedule('weekly-offers-rotation', '0 0 * * 1', 'SELECT update_active_week();');