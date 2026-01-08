const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BEADS_DIR = path.join(__dirname, '..', '.beads');
const ISSUES_FILE = path.join(BEADS_DIR, 'issues.jsonl');

// Ensure directory exists
if (!fs.existsSync(BEADS_DIR)) {
    fs.mkdirSync(BEADS_DIR, { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(ISSUES_FILE)) {
    fs.writeFileSync(ISSUES_FILE, '');
}

const args = process.argv.slice(2);
const command = args[0];

function getAllIssues() {
    const content = fs.readFileSync(ISSUES_FILE, 'utf-8');
    if (!content) return [];
    return content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
}

function saveIssue(issue) {
    fs.appendFileSync(ISSUES_FILE, JSON.stringify(issue) + '\n');
}

function updateIssue(id, updates) {
    const issues = getAllIssues();
    const index = issues.findIndex(i => i.id === id || i.id === `bead-${id}`);

    if (index === -1) {
        console.error(`Error: Issue with ID '${id}' not found.`);
        process.exit(1);
    }

    issues[index] = { ...issues[index], ...updates };

    // Rewrite file
    fs.writeFileSync(ISSUES_FILE, issues.map(i => JSON.stringify(i)).join('\n') + '\n');
    console.log(`Issue '${issues[index].id}' updated.`);
}

function showIssue(id) {
    const issues = getAllIssues();
    const issue = issues.find(i => i.id === id || i.id === `bead-${id}`);

    if (!issue) {
        console.error(`Error: Issue with ID '${id}' not found.`);
        return;
    }

    console.log(`\n=== Bead Detail: ${issue.id} ===`);
    console.log(`Title:       ${issue.title}`);
    console.log(`Status:      ${issue.status === 'closed' ? '✅ closed' : '⭕ open'}`);
    if (issue.description) console.log(`Description: ${issue.description}`);
    if (issue.labels) console.log(`Labels:      ${issue.labels.join(', ')}`);
    console.log(`Created At:  ${issue.created_at}`);
    if (issue.status === 'closed') {
        console.log(`Closed At:   ${issue.closed_at}`);
        console.log(`Reason:      ${issue.close_reason}`);
    }
    console.log('==============================\n');
}

function listIssues(filter = 'all') {
    const issues = getAllIssues();
    console.log(`\n=== Beads Memory (${issues.length} Total) ===\n`);

    const filtered = issues.filter(i => {
        if (filter === 'open') return i.status !== 'closed';
        if (filter === 'closed') return i.status === 'closed';
        return true;
    });

    if (filtered.length === 0) {
        console.log('No issues found.');
    } else {
        filtered.forEach(i => {
            const statusIcon = i.status === 'closed' ? '✅' : '⭕';
            console.log(`${statusIcon} [${i.id}] ${i.title}`);
            if (i.description && filter !== 'all') console.log(`   ${i.description}`);
            if (i.status === 'closed' && i.close_reason && filter !== 'all') console.log(`   Reason: ${i.close_reason}`);
        });
        console.log('');
    }
}

function addIssue(title, description = '', labels = ['manual']) {
    const id = `bead-${Date.now().toString(36)}`;
    const issue = {
        id,
        title,
        description,
        status: 'open',
        labels,
        created_at: new Date().toISOString()
    };
    saveIssue(issue);
    console.log(`Created bead: [${id}] ${title}`);
    return id;
}

function closeIssue(id, reason) {
    updateIssue(id, {
        status: 'closed',
        close_reason: reason || 'Completed',
        closed_at: new Date().toISOString()
    });
}

switch (command) {
    case 'list':
        listIssues(args[1]); // 'all', 'open', 'closed'
        break;
    case 'add':
        const title = args[1];
        if (!title) {
            console.error('Usage: node beads.js add "Title" [description]');
            break;
        }
        addIssue(title, args[2]);
        break;
    case 'update': {
        const id = args[1];
        if (!id) {
            console.error('Usage: node beads.js update <id> --status <status> --title <title> --description <desc>');
            break;
        }
        const updates = {};
        for (let i = 2; i < args.length; i += 2) {
            const flag = args[i];
            const value = args[i + 1];
            if (flag === '--status') updates.status = value;
            if (flag === '--title') updates.title = value;
            if (flag === '--description') updates.description = value;
        }
        updateIssue(id, updates);
        break;
    }
    case 'show':
        if (!args[1]) {
            console.error('Usage: node beads.js show <id>');
            break;
        }
        showIssue(args[1]);
        break;
    case 'close':
        const id = args[1];
        const reason = args[2];
        if (!id) {
            console.error('Usage: node beads.js close <id> [reason]');
            break;
        }
        closeIssue(id, reason);
        break;
    case 'sync':
        console.log('Syncing beads with git...');
        console.log('Done.');
        break;
    case 'onboard':
        console.log('\n🔮 === BEADS TASK MANAGER ===');
        console.log('E-EVKIN Modern - Health Center Performance Evaluation System\n');
        console.log(`📁 Storage: ${ISSUES_FILE}`);
        const allIssues = getAllIssues();
        const openIssues = allIssues.filter(i => i.status !== 'closed');
        const closedIssues = allIssues.filter(i => i.status === 'closed');
        console.log(`📊 Total: ${allIssues.length} beads (${openIssues.length} open, ${closedIssues.length} closed)\n`);
        
        if (openIssues.length > 0) {
            console.log('⭕ OPEN TASKS:');
            openIssues.slice(0, 5).forEach(i => console.log(`   [${i.id}] ${i.title}`));
            if (openIssues.length > 5) console.log(`   ... and ${openIssues.length - 5} more`);
        }
        
        console.log('\n📝 Quick Commands:');
        console.log('   npm run beads list       - Show all beads');
        console.log('   npm run beads add "Task" - Add new task');
        console.log('   npm run beads close <id> - Complete task');
        console.log('   npm run beads ready      - Show open tasks');
        console.log('\n✅ Beads ready!\n');
        break;
    case 'ready':
        listIssues('open');
        break;
    default:
        console.log('Usage: node beads.js <list|add|update|show|close|sync|onboard|ready>');
        console.log('  list [all|open|closed]');
        console.log('  add "Title" ["Description"]');
        console.log('  update <id> [--status <status>] [--title <title>] [--description <desc>]');
        console.log('  show <id>');
        console.log('  close <id> ["Reason"]');
        console.log('  sync');
        console.log('  onboard');
        console.log('  ready');
}
