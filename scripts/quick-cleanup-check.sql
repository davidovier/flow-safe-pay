-- 🔍 QUICK CLEANUP VERIFICATION
-- Run this to check if cleanup was successful

SELECT 
  '🔍 CLEANUP VERIFICATION RESULTS' as status;

-- Count all records in main tables
SELECT 
  'users' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM users
UNION ALL
SELECT 
  'auth_users' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM auth.users
UNION ALL
SELECT 
  'projects' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM projects
UNION ALL
SELECT 
  'deals' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM deals
UNION ALL
SELECT 
  'milestones' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM milestones
UNION ALL
SELECT 
  'deliverables' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM deliverables
UNION ALL
SELECT 
  'payouts' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM payouts
UNION ALL
SELECT 
  'disputes' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '⚠️ HAS DATA' END as status
FROM disputes
ORDER BY table_name;

-- Show system events are preserved
SELECT 
  'SYSTEM EVENTS (should be preserved)' as note,
  COUNT(*) as system_events_count
FROM events 
WHERE actor_user_id IS NULL;

-- Final status
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = 0 
     AND (SELECT COUNT(*) FROM auth.users) = 0 
     AND (SELECT COUNT(*) FROM deals) = 0 
     AND (SELECT COUNT(*) FROM projects) = 0
    THEN '🎉 DATABASE CLEANUP SUCCESSFUL - Ready for fresh testing!'
    ELSE '⚠️ CLEANUP INCOMPLETE - Some data still remains'
  END as final_status;