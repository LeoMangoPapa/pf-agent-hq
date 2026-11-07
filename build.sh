set -e
cd "$(dirname "$0")"
npx esbuild src/main.js --bundle --minify --format=iife --outfile=assets/app.js --log-level=warning
python3 - <<'P'
t=open('src/template.html').read()
m=open('assets/models.js').read(); a=open('assets/app.js').read()
t=t.replace('<script>/*MODELS*/</script>','<script>'+m+'</script>').replace('<script>/*APP*/</script>','<script>'+a.replace('</script','<\\/script')+'</script>')
open('index.html','w').write(t)
P
ls -la index.html
