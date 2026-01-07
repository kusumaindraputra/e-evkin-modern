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
    const index = issues.findIndex(i => i.id === id);

    if (index === -1) {
        console.error(`Error: Issue with ID '${id}' not found.`);
        process.exit(1);
    }

    issues[index] = { ...issues[index], ...updates };

    // Rewrite file
    fs.writeFileSync(ISSUES_FILE, issues.map(i => JSON.stringify(i)).join('\n') + '\n');
    console.log(`Issue '${id}' updated.`);
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
            if (i.description) console.log(`   ${i.description}`);
            if (i.status === 'closed' && i.close_reason) console.log(`   Reason: ${i.close_reason}`);
            console.log('');
        });
    }
}

function addIssue(title, labels = []) {
    const id = `bead-${Date.now().toString(36)}`;
    const issue = {
        id,
        title,
        status: 'open',
        labels,
        created_at: new Date().toISOString()
    };
    saveIssue(issue);
    console.log(`Created bead: [${id}] ${title}`);
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
            console.error('Usage: node beads.js add "Title"');
            break;
        }
        // minimal fix for labels
        addIssue(title, ['manual']);
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
    default:
        console.log('Usage: node beads.js <list|add|close>');
        console.log('  list [all|open|closed]');
        console.log('  add "Task Title"');
        console.log('  close <id> "Reason"');
}
