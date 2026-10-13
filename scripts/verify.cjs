// Uses the existing Playwright CLI runtime; no project dependency install.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
const cli=process.argv[2];if(!cli||!fs.existsSync(cli))throw Error('Usage: node scripts/verify.cjs <absolute-playwright-package>/cli.js');
fs.mkdirSync('test-results',{recursive:true});
const cases=[['browser-flow','testReport'],['mobile-check','mobileReport'],['analytics-browser','analyticsReport'],['entry-v2','entryV2Report'],['snapshot-v2','snapshotV2Report'],['share-v2','shareV2Report'],['resilience-v2','resilienceV2Report'],['workbench-v2','workbenchV2Report'],['diagnostics-v2','diagnosticsV2Report'],['final-mobile','finalMobileReport'],['storage-quota-v2','storageQuotaReport']];
const run=(args)=>{const result=cp.spawnSync(process.execPath,[cli,'cli','-s=reset-verification',...args],{encoding:'utf8',maxBuffer:16*1024*1024});const output=(result.stdout||'')+(result.stderr||'');if(result.status!==0||/### Error/.test(output)){fs.writeFileSync('test-results/verification-error.log',output);throw Error(output.slice(-4000));}return output;};
for(const file of fs.readdirSync('assets').filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(path.join('assets',file),'utf8'),{filename:file});
new vm.Script(fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1]);
const from=process.argv[3];
const selected=from?cases.slice(cases.findIndex(([name])=>name===from)):cases;
if(from&&!cases.some(([name])=>name===from))throw Error('Unknown starting suite '+from);
let report=from&&fs.existsSync('test-results/verification.json')?JSON.parse(fs.readFileSync('test-results/verification.json','utf8')):{};
try {
  run(['open','http://127.0.0.1:4173/','--browser=msedge','--device=iPhone 15']);
  for(const [name,key]of selected) {
    run(['run-code',`--filename=tests/${name}.js`]);
    const output=run(['eval',`window.${key}`]);
    const match=output.match(/### Result\s*([\s\S]*?)\s*### Ran/);if(!match)throw Error('Missing report '+name);
    const result=JSON.parse(match[1]);if(!result?.passed)throw Error('Empty report '+name);report[name]=result;
    fs.writeFileSync('test-results/verification.json',JSON.stringify(report,null,2));console.log('PASS '+name+': '+result.passed);
  }
  for(const file of ['analytics-check.cjs','calendar-check.cjs']){const result=cp.spawnSync(process.execPath,['tests/'+file],{encoding:'utf8'});if(result.status!==0)throw Error(result.stdout+result.stderr);console.log(result.stdout.trim());}
  console.log('PASS all suites; evidence in test-results/verification.json');
} finally {run(['close']);}
