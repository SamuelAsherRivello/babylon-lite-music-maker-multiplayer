param([string]$BaseUrl='http://127.0.0.1:5410/babylon-lite-music-maker-multiplayer/')
$ErrorActionPreference='Stop'
$flow=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'room-flows.js')).TrimEnd().TrimEnd(';').Replace('client=host','client=flow-host').Replace('client=guest','client=flow-guest')
$prefix=@'
async page => {
 const browser=page.context().browser(),base='http://127.0.0.1:5410/babylon-lite-music-maker-multiplayer/';
 for(const c of browser.contexts())if(c!==page.context()&&c.pages().some(p=>/client=(flow-|third|fourth|fifth)/.test(p.url())))await c.close();
 const h=await browser.newContext({viewport:{width:1280,height:720}}),g=await browser.newContext({viewport:{width:1280,height:720}}),host=await h.newPage(),guest=await g.newPage();
 await host.goto(base+'?test=1&mute=true&client=flow-host',{waitUntil:'domcontentloaded'});await host.getByRole('button',{name:'Create room →'}).click();await host.waitForFunction(()=>window.__musicDebug?.status==='connected');
 const code=await host.evaluate(()=>window.__musicDebug.code);await guest.goto(base+'?test=1&mute=true&client=flow-guest&room='+code,{waitUntil:'domcontentloaded'});await guest.getByRole('button',{name:'Enable sound'}).click();await guest.waitForFunction(()=>window.__musicDebug?.playback.active);
 const hostId=await host.evaluate(()=>window.__musicDebug.playback.id);
 const run=(
'@
$suffix=@'
 );const result=await run(host);
 const originals=browser.contexts().flatMap(c=>c.pages()).filter(p=>/client=(host|guest)/.test(p.url()));
 const isolated=await Promise.all(originals.map(p=>p.evaluate(id=>({status:window.__musicDebug.status,roster:window.__musicDebug.players.length,foreignNotes:window.__musicDebug.audio.trace.filter(e=>e.origin===id).length}),hostId)));
 if(isolated.some(s=>s.status!=='connected'||s.roster!==2||s.foreignNotes))throw Error('Independent rooms leaked or interrupted the original jam');
 await h.close();await g.close();return {...result,mode:'parallel independent room',isolated};
}
'@
$prefix=$prefix.Replace("'http://127.0.0.1:5410/babylon-lite-music-maker-multiplayer/'",($BaseUrl|ConvertTo-Json -Compress))
New-Item -ItemType Directory -Force artifacts,verification/results | Out-Null
$target=Join-Path $PWD 'artifacts/parallel-room-flows.js';[IO.File]::WriteAllText($target,$prefix+$flow+$suffix)
& C:\Users\srive\bin\playwright-cli.cmd '-s=music' 'run-code' "--filename=$target" *> artifacts/parallel-room-flows.log
$code=$LASTEXITCODE;$result=Get-Content artifacts/parallel-room-flows.log|Where-Object {$_.StartsWith('{')}|Select-Object -First 1
if($code -ne 0 -or -not $result){Get-Content artifacts/parallel-room-flows.log -Tail 20;throw 'Parallel room flows failed'}
[IO.File]::WriteAllText((Join-Path $PWD 'verification/results/parallel-room-flows.json'),$result+[Environment]::NewLine)
$data=$result|ConvertFrom-Json;[pscustomobject]@{result=$data.result;capacity=$data.capacity;fifthRejected=$data.fifthRejected;epochReset=$data.epochReset.cleared;isolated=$data.isolated}|ConvertTo-Json -Compress
