-- 🧹 COMPLETE DATABASE CLEANUP SCRIPT
-- This script will delete ALL user accounts and related data
-- Use with caution - this is irreversible!

-- =============================================================================
-- BACKUP NOTICE: Make sure to backup important data before running this script
-- =============================================================================

BEGIN;

-- Log the cleanup operation
INSERT INTO events (type, actor_user_id, payload) 
VALUES (
  'system.database_cleanup',
  NULL, -- system operation
  jsonb_build_object(
    'operation', 'complete_user_cleanup',
    'timestamp', now(),
    'reason', 'Development environment reset for testing',
    'tables_affected', ARRAY[
      'deliverables', 'payouts', 'milestones', 'contracts', 
      'disputes', 'deals', 'projects', 'users', 'auth.users'
    ]
  )
);

-- =============================================================================
-- STEP 1: DELETE DATA IN CORRECT ORDER (respecting foreign key constraints)
-- =============================================================================

-- Delete deliverables first (references milestones)
DELETE FROM deliverables;
RAISE NOTICE 'Deleted all deliverables';

-- Delete payouts (references deals)
DELETE FROM payouts;
RAISE NOTICE 'Deleted all payouts';

-- Delete milestones (references deals)
DELETE FROM milestones;
RAISE NOTICE 'Deleted all milestones';

-- Delete contracts (references deals)
DELETE FROM contracts;
RAISE NOTICE 'Deleted all contracts';

-- Delete disputes (references deals and users)
DELETE FROM disputes;
RAISE NOTICE 'Deleted all disputes';

-- Delete deals (references projects and users)
DELETE FROM deals;
RAISE NOTICE 'Deleted all deals';

-- Delete projects (references users)
DELETE FROM projects;
RAISE NOTICE 'Deleted all projects';

-- Delete user events (but keep system events for audit trail)
DELETE FROM events WHERE actor_user_id IS NOT NULL;
RAISE NOTICE 'Deleted user-related events (kept system events)';

-- Delete users from public.users table
DELETE FROM users;
RAISE NOTICE 'Deleted all users from public.users';

-- =============================================================================
-- STEP 2: DELETE AUTH USERS (Supabase auth.users table)
-- This requires special handling as it's in the auth schema
-- =============================================================================

-- Delete all users from auth.users (this will cascade to other auth tables)
DELETE FROM auth.users;
RAISE NOTICE 'Deleted all auth users';

-- =============================================================================
-- STEP 3: RESET SEQUENCES (optional - for clean ID numbering)
-- =============================================================================

-- Reset auto-increment sequences to start from 1 again
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE projects_id_seq RESTART WITH 1;
-- ALTER SEQUENCE deals_id_seq RESTART WITH 1;
-- ALTER SEQUENCE milestones_id_seq RESTART WITH 1;
-- ALTER SEQUENCE deliverables_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payouts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE disputes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE contracts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE events_id_seq RESTART WITH 1;

-- RAISE NOTICE 'Reset all sequences to start from 1';

-- =============================================================================
-- STEP 4: VERIFICATION QUERIES
-- =============================================================================

-- Count remaining records in each table
SELECT 'CLEANUP VERIFICATION RESULTS:' as status;

SELECT 
  'users' as table_name, 
  COUNT(*) as remaining_records 
FROM users
UNION ALL
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as remaining_records 
FROM auth.users
UNION ALL
SELECT 
  'projects' as table_name, 
  COUNT(*) as remaining_records 
FROM projects
UNION ALL
SELECT 
  'deals' as table_name, 
  COUNT(*) as remaining_records 
FROM deals
UNION ALL
SELECT 
  'milestones' as table_name, 
  COUNT(*) as remaining_records 
FROM milestones
UNION ALL
SELECT 
  'deliverables' as table_name, 
  COUNT(*) as remaining_records 
FROM deliverables
UNION ALL
SELECT 
  'payouts' as table_name, 
  COUNT(*) as remaining_records 
FROM payouts
UNION ALL
SELECT 
  'disputes' as table_name, 
  COUNT(*) as remaining_records 
FROM disputes
UNION ALL
SELECT 
  'contracts' as table_name, 
  COUNT(*) as remaining_records 
FROM contracts
UNION ALL
SELECT 
  'user_events' as table_name, 
  COUNT(*) as remaining_records 
FROM events 
WHERE actor_user_id IS NOT NULL
UNION ALL
SELECT 
  'system_events' as table_name, 
  COUNT(*) as remaining_records 
FROM events 
WHERE actor_user_id IS NULL
ORDER BY table_name;

-- Final cleanup log
INSERT INTO events (type, actor_user_id, payload) 
VALUES (
  'system.database_cleanup_completed',
  NULL, -- system operation
  jsonb_build_object(
    'operation', 'complete_user_cleanup',
    'completed_at', now(),
    'status', 'success',
    'message', 'All user accounts and related data have been successfully removed'
  )
);

RAISE NOTICE '✅ DATABASE CLEANUP COMPLETED SUCCESSFULLY';
RAISE NOTICE 'All user accounts and related data have been removed.';
RAISE NOTICE 'System events and table structure have been preserved.';

-- Commit the transaction
COMMIT;