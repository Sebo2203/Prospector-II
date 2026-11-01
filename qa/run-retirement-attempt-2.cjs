require('./playthrough-runner.cjs').run('retirement').catch(error => { console.error(error); process.exitCode = 1; });
