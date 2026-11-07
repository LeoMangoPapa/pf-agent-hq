import base64,os,json
d='assets/models';o={}
for f in sorted(os.listdir(d)):
    o[f]=base64.b64encode(open(os.path.join(d,f),'rb').read()).decode()
open('assets/models.js','w').write('window.MODELS='+json.dumps(o)+';')
