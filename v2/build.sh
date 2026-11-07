set -e
cd "$(dirname "$0")/.."/v2
../node_modules/.bin/esbuild src/main.js --bundle --minify --format=iife --outfile=app.js --log-level=warning
python3 - <<'P'
t=open('src/template.html').read()
m=open('../assets/models.js').read(); a=open('app.js').read()
t=t.replace('<script>/*MODELS*/</script>','<script>'+m+'</script>').replace('<script>/*APP*/</script>','<script>'+a.replace('</script','<\\/script')+'</script>')
open('index.html','w').write(t.replace('/*API*/','/api/status').replace('/*RKEY*/',''))
P
