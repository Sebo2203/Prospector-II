require('./playthrough-runner.cjs').run('short').catch(error => { console.error(error); process.exitCode = 1; });
