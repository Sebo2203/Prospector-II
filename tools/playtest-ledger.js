const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'playtest-reports');

function count(report, action) {
  return Number(report.actionCounts?.[action] || 0);
}

function deathCause(report) {
  const explicit = report.final?.deathCause || report.deathCause;
  if (explicit && !/crew perished|no death cause/i.test(explicit)) return String(explicit);
  const deathFinding = (report.findings || []).find(f => f.title === 'Run ended in death');
  const findingCause = deathFinding?.evidence || '';
  if (findingCause && !/crew perished|no death cause/i.test(findingCause)) return findingCause;

  const messages = (report.trace || []).slice(-40).flatMap(action => [
    action.after?.message,
    action.before?.message,
  ]).filter(Boolean).reverse();
  const useful = messages.find(message =>
    /lava|suffocat|oxygen depleted|out of oxygen|toxin|poison|acid|ammonia|bleed|sepsis|infection|fever|parasite|cave bug|strikes|pirate|ship destroyed|hull breach/i
      .test(message) &&
    !/^your crew strikes/i.test(message) &&
    !/all crew dead|mission failed/i.test(message));
  return useful || findingCause;
}

function deathCategory(cause) {
  const text = String(cause || '').toLowerCase();
  if (/lava|volcan/.test(text)) return 'lava';
  if (/oxygen|suffocat/.test(text)) return 'oxygen';
  if (/toxin|poison|acid|ammonia/.test(text)) return 'toxic-hazard';
  if (/bleed|sepsis|infection|fever|parasite/.test(text)) return 'medical';
  if (/cave bug|strikes|creature|alien|ground combat/.test(text)) return 'ground-combat';
  if (/pirate|ship|hull|combat/.test(text)) return 'ship-combat';
  return text ? 'other' : 'unknown';
}

function technicalSignals(report) {
  const signals = [];
  if ((report.errors || []).length) signals.push('runtime-error');
  if (report.stopReason === 'possible soft lock') signals.push('soft-lock');
  if (report.stopReason === 'repeating state cycle' ||
    /^repeating (coarse )?position cycle/.test(report.stopReason || '')) signals.push('state-cycle');
  if ((report.maxNoProgressStreak || 0) >= 8) signals.push('no-progress');
  if (count(report, 'unsupported-mode')) signals.push('unsupported-mode');
  if (count(report, 'tester-water-recovery')) signals.push('tester-assist');
  if (count(report, 'ship-fire') && (report.noProgressActions?.['ship-fire'] || 0) >= 5) {
    signals.push('ineffective-ship-fire');
  }
  return signals;
}

function buildLedgerEntry(report, filename) {
  const final = report.final || {};
  const initial = report.initial || {};
  const maxActions = Number(report.options?.maxActions || 0);
  const reachedBudget = maxActions > 0 && Number(report.actions || 0) >= maxActions;
  const cause = final.dead ? deathCause(report) : '';
  const signals = technicalSignals(report);
  let outcome = 'partial';
  if (final.dead) outcome = 'death';
  else if (final.retired) outcome = 'retired';
  else if (reachedBudget || report.stopReason === 'action limit') outcome = 'completed';
  else if (report.stopReason === 'medical emergency without treatment funds') outcome = 'stranded';

  let autoBucket = 'partial-run';
  if (signals.length) autoBucket = 'tester-gap';
  else if (outcome === 'death') autoBucket = 'death-needs-review';
  else if (outcome === 'completed' || outcome === 'retired') autoBucket = 'baseline';

  const topAction = Object.entries(report.actionCounts || {})
    .sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const existingReview = report.ledger?.review || {};

  return {
    runId: path.basename(filename, '.json'),
    reportFile: filename,
    startedAt: report.startedAt || '',
    endedAt: report.endedAt || '',
    agentVersion: report.agentVersion || '',
    seed: report.seed ?? '',
    shipClass: report.bootstrap?.shipClass || '',
    outcome,
    stopReason: report.stopReason || (reachedBudget ? 'action limit' : ''),
    autoBucket,
    technicalSignals: signals,
    deathCategory: final.dead ? deathCategory(cause) : '',
    deathCause: cause,
    actions: Number(report.actions || 0),
    turns: Number(final.turn || 0) - Number(initial.turn || 0),
    durationMs: Number(report.durationMs || 0),
    creditsStart: Number(initial.credits || 0),
    creditsEnd: Number(final.credits || 0),
    creditsDelta: Number(final.credits || 0) - Number(initial.credits || 0),
    crewStart: Number(initial.crewAlive || 0),
    crewEnd: Number(final.crewAlive || 0),
    crewHpLost: Number(report.losses?.crewHp || 0),
    hullLost: Number(report.losses?.hull || 0),
    fuelUsed: Number(report.losses?.fuel || 0),
    medicalDiversions: count(report, 'leave-system-medical'),
    relocations: count(report, 'relocate-landing'),
    testerWaterRecoveries: count(report, 'tester-water-recovery'),
    groundCombats: count(report, 'attack-ground'),
    shipCombatActions: count(report, 'ship-fire') +
      count(report, 'ship-retreat') +
      count(report, 'ship-retreat-unarmed') +
      count(report, 'ship-surrender-stranded'),
    topAction: topAction[0],
    topActionCount: topAction[1],
    errors: (report.errors || []).length,
    maxNoProgressStreak: Number(report.maxNoProgressStreak || 0),
    finalMode: final.mode || '',
    finalMessage: final.message || '',
    findingTitles: (report.findings || []).map(f => f.title),
    review: {
      status: existingReview.status || 'unreviewed',
      bucket: existingReview.bucket || '',
      notes: existingReview.notes || '',
    },
  };
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

function buildSummary(entries) {
  const tally = (key, values = entries) => {
    const out = {};
    for (const entry of values) {
      const value = entry[key] || 'none';
      out[value] = (out[value] || 0) + 1;
    }
    return out;
  };
  const completed = entries.filter(e => e.outcome === 'completed' || e.outcome === 'retired');
  const deaths = entries.filter(e => e.outcome === 'death');
  const groupStats = key => {
    const groups = {};
    for (const entry of entries) {
      const name = entry[key] || 'unknown';
      const group = groups[name] || {
        runs: 0,
        completed: 0,
        deaths: 0,
        creditsDeltaTotal: 0,
        turnsTotal: 0,
      };
      group.runs++;
      if (entry.outcome === 'completed' || entry.outcome === 'retired') group.completed++;
      if (entry.outcome === 'death') group.deaths++;
      group.creditsDeltaTotal += entry.creditsDelta;
      group.turnsTotal += entry.turns;
      groups[name] = group;
    }
    for (const group of Object.values(groups)) {
      group.averageCreditsDelta = Math.round(group.creditsDeltaTotal / group.runs);
      group.averageTurns = Math.round(group.turnsTotal / group.runs);
      delete group.creditsDeltaTotal;
      delete group.turnsTotal;
    }
    return groups;
  };
  return {
    generatedAt: new Date().toISOString(),
    runs: entries.length,
    outcomes: tally('outcome'),
    autoBuckets: tally('autoBucket'),
    deathCategories: tally('deathCategory', deaths),
    reviewBuckets: tally('reviewBucket', entries.map(entry => ({
      reviewBucket: entry.review?.bucket || 'unreviewed',
    }))),
    byAgentVersion: groupStats('agentVersion'),
    byShipClass: groupStats('shipClass'),
    completedRuns: completed.length,
    averageCompletedTurns: completed.length
      ? Math.round(completed.reduce((sum, e) => sum + e.turns, 0) / completed.length)
      : 0,
    averageCompletedCreditsDelta: completed.length
      ? Math.round(completed.reduce((sum, e) => sum + e.creditsDelta, 0) / completed.length)
      : 0,
    totalMedicalDiversions: entries.reduce((sum, e) => sum + e.medicalDiversions, 0),
    totalRelocations: entries.reduce((sum, e) => sum + e.relocations, 0),
  };
}

function rebuildLedger({ updateReports = true } = {}) {
  fs.mkdirSync(reportDir, { recursive: true });
  const files = fs.readdirSync(reportDir)
    .filter(name => /^prospector-playtest-.*\.json$/i.test(name))
    .sort();
  const entries = [];

  for (const filename of files) {
    const fullPath = path.join(reportDir, filename);
    const report = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const entry = buildLedgerEntry(report, filename);
    entries.push(entry);
    if (updateReports) {
      report.ledger = entry;
      fs.writeFileSync(fullPath, JSON.stringify(report, null, 2), 'utf8');
    }
  }

  entries.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  fs.writeFileSync(
    path.join(reportDir, 'playtest-ledger.json'),
    JSON.stringify(entries, null, 2),
    'utf8',
  );

  const columns = entries.length ? Object.keys(entries[0]).filter(key => key !== 'review') : [];
  const csvColumns = [...columns, 'reviewStatus', 'reviewBucket', 'reviewNotes'];
  const csvRows = [csvColumns.map(csvCell).join(',')];
  for (const entry of entries) {
    csvRows.push(csvColumns.map(key => {
      if (key === 'reviewStatus') return csvCell(entry.review.status);
      if (key === 'reviewBucket') return csvCell(entry.review.bucket);
      if (key === 'reviewNotes') return csvCell(entry.review.notes);
      return csvCell(entry[key]);
    }).join(','));
  }
  fs.writeFileSync(path.join(reportDir, 'playtest-ledger.csv'), csvRows.join('\r\n'), 'utf8');
  fs.writeFileSync(
    path.join(reportDir, 'playtest-summary.json'),
    JSON.stringify(buildSummary(entries), null, 2),
    'utf8',
  );
  return entries;
}

module.exports = { buildLedgerEntry, rebuildLedger };

if (require.main === module) {
  const entries = rebuildLedger();
  console.log('Playtest ledger rebuilt from ' + entries.length + ' reports.');
}
