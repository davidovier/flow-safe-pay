# 🧹 Database Cleanup Scripts

## Overview

These scripts help you clean up all user accounts and related data from your FlowPay database while preserving system events and table structure.

## Scripts Available

1. **`backup-before-cleanup.sql`** - Optional backup script (recommended)
2. **`cleanup-database.sql`** - Main cleanup script that deletes all user data
3. **`quick-cleanup-check.sql`** - Verification script to confirm cleanup success

## 🚀 Quick Start

### Option 1: Using Supabase CLI (Recommended)

```bash
# 1. Optional: Create backup first
npx supabase db reset --db-url "your_database_url" < scripts/backup-before-cleanup.sql

# 2. Run the cleanup
npx supabase db reset --db-url "your_database_url" < scripts/cleanup-database.sql

# 3. Verify cleanup was successful
npx supabase db reset --db-url "your_database_url" < scripts/quick-cleanup-check.sql
```

### Option 2: Using psql directly

```bash
# 1. Optional: Create backup first
psql "your_database_url" -f scripts/backup-before-cleanup.sql

# 2. Run the cleanup
psql "your_database_url" -f scripts/cleanup-database.sql

# 3. Verify cleanup was successful
psql "your_database_url" -f scripts/quick-cleanup-check.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each script content
4. Execute them in order: backup → cleanup → verification

## ⚠️ Important Notes

- **IRREVERSIBLE**: The cleanup operation cannot be undone
- **BACKUP RECOMMENDED**: Run the backup script first if you want to preserve data
- **SYSTEM EVENTS PRESERVED**: System events (audit trail) are kept for compliance
- **FOREIGN KEYS**: Scripts respect foreign key constraints and delete in proper order

## What Gets Deleted

✅ **Deleted:**
- All user accounts (auth.users and public.users)
- All projects, deals, milestones, deliverables
- All payouts, disputes, contracts
- User-generated events

✅ **Preserved:**
- System events (audit trail)
- Database schema and structure
- Sequences and indexes

## Verification

After running cleanup, the verification script will show:

```
✅ CLEAN - All user data removed
🎉 DATABASE CLEANUP SUCCESSFUL - Ready for fresh testing!
```

## Troubleshooting

### Permission Issues
If you get permission errors, ensure your database user has DELETE privileges:
```sql
GRANT DELETE ON ALL TABLES IN SCHEMA public TO your_user;
GRANT DELETE ON auth.users TO your_user;
```

### Foreign Key Constraints
The scripts are designed to handle foreign key constraints automatically by deleting in the correct order.

## Development Workflow

After cleanup, you can:
1. Start fresh user registration testing
2. Test all user roles (CREATOR, BRAND, ADMIN, AGENCY)
3. Verify role-based navigation works correctly
4. Test the complete authentication flow

---

**🎯 Ready to clean up and start fresh testing!**