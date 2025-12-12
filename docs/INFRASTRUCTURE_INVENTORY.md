# Troy's Dashboard Infrastructure - Complete Inventory

## URLs & Endpoints

### Primary Dashboard
- **URL:** http://troy-intelligence-dashboard.s3-website-ap-southeast-2.amazonaws.com
- **S3 Bucket:** troy-intelligence-dashboard
- **Region:** ap-southeast-2 (Sydney)
- **File:** index.html
- **Status:** ✅ Active (showing ERR for data - connection issue)

### Secondary Dashboard (Deprecated)
- **URL:** https://tech4humanity-hub.lovable.app
- **Repo:** https://github.com/TML-4PM/mcp-command-centre
- **Status:** ⚠️ Stuck loading, not in use

### MCP Bridge
- **URL:** https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com
- **Routes:** /lambda/invoke, /mobile/health
- **Status:** ✅ Active (file operations only, no network access)

### Supabase Database
- **URL:** https://lzfgigiyqpuuxslsygjt.supabase.co
- **Project ID:** lzfgigiyqpuuxslsygjt
- **Region:** ap-southeast-2
- **Status:** ✅ Active

---

## Database Tables

### Core Tables
1. **holowog_projects** - 5 projects (Holowog, AHC, RATPAK, NEUROPAK, GC-BAT)
2. **run_queue** - Command execution queue for troy-mcp-command
3. **sql_execution_log** - Audit log for all SQL executions
4. **secrets_configuration** - Encrypted credentials and tokens

### Other Tables
- cv_applications
- cv_generation_log
- job_applications
- job_opportunities
- Various other project-specific tables

---

## Functions & Tools

### SQL Executor System

#### 1. troy-sql CLI
- **Location:** /usr/local/bin/troy-sql (on Mac)
- **Purpose:** Execute SQL queries from terminal
- **Usage:** `troy-sql "SELECT * FROM holowog_projects"`
- **Security:** SELECT/INSERT/UPDATE/DELETE only, blocks DDL
- **Cost:** $0/month

#### 2. execute_sql() Supabase Function
- **Name:** execute_sql(query text, params jsonb)
- **Type:** PostgreSQL function
- **Security:** SECURITY DEFINER
- **Audit:** Logs all executions to sql_execution_log
- **Restrictions:** Blocks DROP, TRUNCATE, ALTER, CREATE, GRANT

#### 3. Dashboard SQL Console
- **Location:** S3 dashboard index.html
- **Features:**
  - Quick query buttons (Active Projects, Recent Tasks, Project Count, SQL Logs)
  - Multi-line SQL editor
  - JSON results display
  - Error handling
- **Status:** ⚠️ Not connecting (shows ERR)

---

## Dashboard Components

### Current S3 Dashboard (dashboard_fixed.html)

#### Stats Cards (Top Row)
1. **📊 Projects** - Shows COUNT(*) FROM holowog_projects
2. **📋 Tasks** - Shows COUNT(*) FROM run_queue
3. **🔍 Queries** - Shows COUNT(*) FROM sql_execution_log

#### SQL Query Console (Bottom Section)
- **Quick Buttons:**
  - Active Projects: `SELECT * FROM holowog_projects WHERE status = 'active'`
  - Recent Tasks: `SELECT * FROM run_queue ORDER BY created_at DESC LIMIT 10`
  - Project Count: `SELECT COUNT(*) FROM holowog_projects`
  - SQL Logs: `SELECT * FROM sql_execution_log ORDER BY executed_at DESC LIMIT 10`

- **Features:**
  - Multi-line textarea for custom queries
  - Execute button
  - JSON results display with row count
  - Error display with red styling

#### Auto-Refresh System
- **Frequency:** Every 6 hours (4x per day)
- **Schedule:** 00:00, 06:00, 12:00, 18:00 AEDT
- **Method:** JavaScript setInterval (21600000 ms)
- **Behavior:** Refreshes data in-place, no new window/tab

---

## Authentication & Keys

### Supabase Keys
- **Service Role Key:** Stored in vault.env and embedded in scripts
- **Anon Key:** Available but not used in current setup

### Storage Locations
- **Mac:** ~/bridge/vault.env
- **Dashboard:** Embedded in HTML JavaScript
- **troy-sql CLI:** Embedded in bash script

---

## Known Issues

### Current Problems
1. **Dashboard ERR Status** - All three stat cards show "ERR"
   - **Cause:** Unknown - need browser console error
   - **Suspects:** CORS, key permissions, DNS resolution
   - **Impact:** Dashboard loads but shows no data

2. **Lovable Dashboard Stuck** - tech4humanity-hub.lovable.app not loading
   - **Status:** Abandoned, using S3 instead

3. **Bridge Network Restrictions**
   - Cannot access Supabase (DNS/403 errors)
   - Cannot access GitHub (401 errors)
   - Limited to local file operations only

### Resolved Issues
- ✅ URL typo (lzfgigiypquuxslsygjt vs lzfgigiyqpuuxslsygjt)
- ✅ execute_sql() function created and working
- ✅ troy-sql CLI installed and operational
- ✅ S3 dashboard deployed (but not connecting)

---

## MCP Infrastructure

### troy-mcp-command System
- **Components:**
  1. Lambda function: troy-mcp-command
  2. Supabase queue: run_queue table
  3. Mac worker: Polls queue every 2 seconds
  4. CLI: `troy-cmd` command

- **Workflow:**
  1. Lambda receives command via MCP Bridge
  2. Lambda writes to run_queue in Supabase
  3. Mac worker polls queue
  4. Mac executes bash command
  5. Result returned to caller

- **Status:** ✅ Active
- **Cost:** ~$1/month

---

## Automation Systems

### omnibrain-consolidator
- **Frequency:** Daily at 6:00 AM AEDT
- **Purpose:** Consolidates data across systems
- **Status:** ✅ Active

### S3 Backup System
- **Frequency:** Daily
- **Source:** Mac files
- **Destination:** S3 buckets
- **Freed Space:** 2.35GB (removed 124K duplicates)

---

## URLs Quick Reference

| Service | URL |
|---------|-----|
| Dashboard | http://troy-intelligence-dashboard.s3-website-ap-southeast-2.amazonaws.com |
| Supabase | https://lzfgigiyqpuuxslsygjt.supabase.co |
| MCP Bridge | https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com |
| GitHub Repo | https://github.com/TML-4PM/mcp-command-centre |
| Lovable (deprecated) | https://tech4humanity-hub.lovable.app |

---

## Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| Supabase Free Tier | $0 |
| troy-sql CLI | $0 |
| S3 Dashboard | $0.01 |
| troy-mcp-command | ~$1 |
| MCP Bridge Lambda | ~$0.10 |
| **Total** | **~$1.11/month** |

---

**Last Updated:** 2025-12-12
**Dashboard Status:** Deployed but showing ERR (connection issue)
**Next Action:** Check browser console for error details
