#!/bin/bash
# usage: build.sh <concept-dir>  -> <dir>/index.html (self-contained)
set -e; D=$1; export R=$(git rev-parse --show-toplevel)
$R/node_modules/.bin/esbuild $D/scene.js --bundle --minify --format=iife --outfile=$D/app.js --log-level=warning --alias:three=$R/node_modules/three
python3 - "$D" <<'P'
import sys,re; D=sys.argv[1]; import os; R=os.environ['R']
t=open(R+'/v2/src/template.html').read()
m=open(R+'/assets/models.js').read(); a=open(D+'/app.js').read()
t=re.sub(r'<script>window\.PF_HQ=.*?</script>','',t)
extra=open(D+'/extra.css').read() if __import__('os').path.exists(D+'/extra.css') else ''
t=t.replace('</style>',extra+'</style>')
t=t.replace('<script>/*MODELS*/</script>','<script>'+m+'</script>').replace('<script>/*APP*/</script>','<script>'+a.replace('</script','<\\/script')+'</script>')
open(D+'/index.html','w').write(t)
P
