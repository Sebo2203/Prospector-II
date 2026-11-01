require('./playthrough-runner.cjs').run('long').catch(error => { console.error(error); process.exitCode = 1; });
