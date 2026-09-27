#!/bin/sh
set -eu
folder=validation/explicit-project-preparation-01
api_pid=
ui_pid=
cleanup() {
  [ -z "$ui_pid" ] || kill "$ui_pid" 2>/dev/null || true
  [ -z "$api_pid" ] || kill "$api_pid" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM
node_modules/.bin/vite-node --config "$folder/vite-replay.config.ts" "$folder/replay-api.ts" > "$folder/replay-api.log" 2>&1 &
api_pid=$!
node_modules/.bin/vite --config "$folder/vite-replay.config.ts" > "$folder/browser-vite.log" 2>&1 &
ui_pid=$!
node --input-type=module <<'JS'
for (const port of [4187,4188]) {
 let ready=false;
 for(let i=0;i<100;i++){
  try {const r=await fetch(`http://127.0.0.1:${port}${port===4187?'/__control':''}`,port===4187?{method:'POST',body:'{}'}:{});if(r.ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 if(!ready)throw Error('LOCAL_REPLAY_SERVER_UNAVAILABLE');
}
JS
node "$folder/browser-reload.mjs" > "$folder/browser-tests.log" 2>&1
