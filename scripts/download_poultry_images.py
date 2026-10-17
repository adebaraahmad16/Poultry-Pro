import hashlib, urllib.request
from pathlib import Path
Path('.image-sources').mkdir(exist_ok=True)
items=[('hero','https://images.pexels.com/photos/26625882/pexels-photo-26625882.jpeg?auto=compress&cs=tinysrgb&w=1920'),('farmer','Counting Beaks, Measuring Hope in the Brooder’s Glow.jpg'),('cta','Une fermière dans sa ferme avec de gros poulets.jpg')]
items.append(('poultry-types','Farmer feeding his poultry 01.jpg'))
import sys
for name,source in items:
 if len(sys.argv)>1 and name not in sys.argv[1:]: continue
 if not source.startswith('https:'):
  filename=source.replace(' ','_');digest=hashlib.md5(filename.encode()).hexdigest();source='https://upload.wikimedia.org/wikipedia/commons/'+digest[0]+'/'+digest[:2]+'/'+urllib.parse.quote(filename)
 request=urllib.request.Request(source,headers={'User-Agent':'PoultryPro/1.0 (website asset preparation)'})
 with urllib.request.urlopen(request,timeout=30) as response: data=response.read()
 Path('.image-sources/'+name+'.jpg').write_bytes(data)
 print(name,len(data))
