#!/bin/sh
# Builds app.js and preview.html (offline, mock data). Production index.html is produced with MOCK unset.
set -e
cd "$(dirname "$0")/.."/candy-castle
../node_modules/.bin/esbuild src/main.js --bundle --minify --format=iife --outfile=app.js --log-level=warning
python3 - <<'P'
t=open('src/template.html').read()
m=open('../assets/models.js').read(); a=open('app.js').read(); mock=open('src/mock.js').read()
t=t.replace('<script>/*MODELS*/</script>','<script>'+m+'</script>').replace('<script>/*APP*/</script>','<script>'+a.replace('</script','<\\/script')+'</script>')
t=t.replace('<title>Agent HQ Pearl Farm</title>','<title>Agent HQ Pearl Farm · Lâu đài kẹo ngọt</title>')
open('index.html','w').write(t.replace('/*API*/','/api/status').replace('/*RKEY*/',''))
pv=t.replace('/*API*/','/api/status').replace('/*RKEY*/','').replace('<div id="app">','<script>'+mock+'</script><div id="app">',1)
open('preview.html','w').write(pv)
P
ls -la preview.html index.html
