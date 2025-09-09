# 🧹 Database Cleanup Scripts

## Overview

These scripts help you clean up all user accounts and related data from your FlowPay database while preserving system events and table structure.

## Scripts Available

1. **`backup-before-cleanup.sql`** - Optional backup script (recommended)
2. **`cleanup-database.sql`** - Main cleanup script that deletes all user data
3. **`quick-cleanup-check.sql`** - Verification script to confirm cleanup success

## 🚀 Quick Start

### Option 1: Using Supabase Dashboard (No installation needed - Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. **For cleanup:**
   - Copy the entire content from `scripts/cleanup-database.sql`
   - Paste it into a new SQL query
   - Click **Run** to execute
4. **For verification:**
   - Copy the content from `scripts/quick-cleanup-check.sql`
   - Paste it into a new SQL query  
   - Click **Run** to verify cleanup was successful

### Option 2: Using psql directly (Requires installation)

```bash
# 1. Optional: Create backup first
psql -h db.vncpvmndkdzcdberruxv.supabase.co -p 5432 -d postgres -U postgres -f scripts/backup-before-cleanup.sql

# 2. Run the cleanup
psql -h db.vncpvmndkdzcdberruxv.supabase.co -p 5432 -d postgres -U postgres -f scripts/cleanup-database.sql

# 3. Verify cleanup was successful
psql -h db.vncpvmndkdzcdberruxv.supabase.co -p 5432 -d postgres -U postgres -f scripts/quick-cleanup-check.sql
```

**First install psql if needed:**
```bash
# On macOS using Homebrew
brew install postgresql
```

**Then run cleanup:**
```bash
# Direct connection
psql -h db.vncpvmndkdzcdberruxv.supabase.co -p 5432 -d postgres -U postgres -f scripts/cleanup-database.sql

# Or with connection string (if you have password)
psql "postgresql://postgres:your_password@db.vncpvmndkdzcdberruxv.supabase.co:5432/postgres" -f scripts/cleanup-database.sql
```

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