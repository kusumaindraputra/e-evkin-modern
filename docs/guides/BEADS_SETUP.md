# Beads Task Tracking Setup

## Installation Status
✅ **Beads v0.43.0** installed dan dikonfigurasi untuk project e-evkin-modern

## Quick Start Commands

```bash
# View ready tasks (no blockers)
bd ready

# Create new task
bd create "Task title" -p 1 -l "label1,label2" -d "Description"

# View task details
bd show e-evkin-modern-d1i

# Add dependency
bd dep add <child-id> <parent-id>

# Show all open issues
bd list --open
```

## Priority Levels
- **P0** (0) - Critical/Hot
- **P1** (1) - High
- **P2** (2) - Medium (default)
- **P3** (3) - Low
- **P4** (4) - Nice-to-have

## Current Issues Being Tracked

### 🔴 P0 - Critical
- **e-evkin-modern-sx7**: Fix duplicate angkas records per sumber anggaran
  - ✅ **RESOLVED** - Removed 37,263 duplicate records
  - Used approach: Store angkas once per kode_rekening (not per sumber_anggaran)

### 🟡 P1 - High
- **e-evkin-modern-d1i**: Unify data structure between Excel targets and PDF angkas
  - Status: Design phase
  - Excel: Granular per-sumber anggaran
  - PDF: Only per-kode rekening
  - Blocks: e-evkin-modern-sx7, e-evkin-modern-1va

- **e-evkin-modern-1va**: Investigate discrepancies between Excel and PDF uploads
  - Status: Investigation phase
  - Cross-source validation needed for data consistency

## Why Beads?

For long-running projects like e-evkin-modern, Beads provides:

### Memory Management
- **Git-backed storage**: All tasks in `.beads/` folder, versioned like code
- **SQLite cache**: Fast local lookups without network
- **Semantic compaction**: Auto-summarize closed tasks to save context

### Agent-Optimized
- **JSON output**: Perfect for programmatic access
- **Dependency tracking**: Visualize blockers and ready tasks
- **Hash-based IDs**: `e-evkin-modern-d1i` format prevents merge collisions

### Invisible Infrastructure
- **Auto-sync daemon**: Background process syncs with git
- **Zero conflict**: Hash-based IDs mean no conflicts in multi-branch workflows
- **Persistent**: Context preserved across agent sessions

## Configuration

### Files Created
- `.beads/config.yaml` - Configuration
- `.beads/issues.jsonl` - All issues in JSON Lines format
- `.beads/interactions.jsonl` - Comments and activity
- `.beads/metadata.json` - Metadata

### Environment Variables (Optional)
```bash
BD_ACTOR="Agent Name"           # Default: $USER
BD_DB_PATH=".beads/beads.db"    # Default: auto-discover
```

## Accessing bd Command

On Windows, the `bd` command is available after installation. If not in PATH:
```powershell
& "C:\Users\kusum\AppData\Roaming\npm\bd.exe" ready
```

## Next Steps

1. **Configure sync branch** (optional for multi-clone setups):
   ```bash
   bd migrate sync beads-sync
   ```

2. **Create more issues** as development progresses:
   ```bash
   bd create "Feature: ..." -p 2 -d "Description" --parent e-evkin-modern-d1i
   ```

3. **Track dependencies** between tasks:
   ```bash
   bd dep add e-evkin-modern-1va e-evkin-modern-d1i
   ```

4. **View task status**:
   ```bash
   bd show e-evkin-modern-d1i
   bd ready  # Shows all unblocked tasks
   ```

## Documentation
- Full docs: https://github.com/steveyegge/beads
- Agent workflow: Check `AGENTS.md` in project root
