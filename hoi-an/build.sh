#!/bin/sh
# Builds hoi-an/app.js, index.html (production, live /api) and preview.html (offline mock data). Deploy = copy index.html to cf/public/hoian.html (see DEPLOY.md).
set -e
cd "$(dirname "$0")/.."/hoi-an
../node_modules/.bin/esbuild src/main.js --bundle --minify --format=iife --outfile=app.js --log-level=warning
python3 - <<'P'
t=open('src/template.html').read()
m=open('../assets/models.js').read(); a=open('app.js').read(); mock=open('src/mock.js').read()
t=t.replace('<script>/*MODELS*/</script>','<script>'+m+'</script>').replace('<script>/*APP*/</script>','<script>'+a.replace('</script','<\\/script')+'</script>')
t=t.replace('<title>Agent HQ Pearl Farm</title>','<title>Agent HQ Pearl Farm · Phố Hội Đèn Lồng</title>')
st='padding:9px 12px;font-size:12.5px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center'
nav='<details class="th-menu glass"><summary>🏮 Phố Hội ▾</summary><div class="dd glass"><a href="/">🌊 Hồ Gươm</a><a href="/space">🪐 Ngọc trai vũ trụ</a><a href="/candy">🍭 Lâu đài kẹo ngọt</a></div></details>'
assert '<div id="upd"' in t
t=t.replace('<div id="upd"',nav+'\n <div id="upd"',1)
open('index.html','w').write(t.replace('/*API*/','/api/status').replace('/*RKEY*/',''))
pv=t.replace('/*API*/','/api/status').replace('/*RKEY*/','').replace('<div id="app">','<script>'+mock+'</script><div id="app">',1)
open('preview.html','w').write(pv)
P
ls -la preview.html index.html
