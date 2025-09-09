-- 💾 BACKUP SCRIPT - Run before cleanup (optional but recommended)
-- This creates a backup of current data for safety

-- Create backup tables with current data
CREATE TABLE IF NOT EXISTS backup_users_$(date +%Y%m%d) AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS backup_projects_$(date +%Y%m%d) AS SELECT * FROM projects;
CREATE TABLE IF NOT EXISTS backup_deals_$(date +%Y%m%d) AS SELECT * FROM deals;
CREATE TABLE IF NOT EXISTS backup_events_$(date +%Y%m%d) AS SELECT * FROM events WHERE actor_user_id IS NOT NULL;

-- Log backup creation
INSERT INTO events (type, actor_user_id, payload) 
VALUES (
  'system.backup_created',
  NULL,
  jsonb_build_object(
    'backup_timestamp', now(),
    'backup_reason', 'Before database cleanup',
    'tables_backed_up', ARRAY['users', 'projects', 'deals', 'events']
  )
);

-- Show backup summary
SELECT 
  'BACKUP SUMMARY' as status,
  (SELECT COUNT(*) FROM users) as users_backed_up,
  (SELECT COUNT(*) FROM projects) as projects_backed_up,
  (SELECT COUNT(*) FROM deals) as deals_backed_up,
  (SELECT COUNT(*) FROM events WHERE actor_user_id IS NOT NULL) as user_events_backed_up;