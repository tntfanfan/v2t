from pathlib import Path
import hashlib,json,zipfile
root=Path('E:/英语复习/miniprogram/english-review-bluey-v5')
target=root.parent/'英语复习_Bluey两集_1.2.2_小程序.zip'
with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(root.rglob('*')):
  if p.is_file() and p.name!='project.private.config.json':archive.write(p,Path(root.name)/p.relative_to(root))
with zipfile.ZipFile(target) as archive:
 assert archive.testzip() is None
 assert f'{root.name}/project.config.json' in archive.namelist()
report={'version':'1.2.2','archive':str(target),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'status':'local_importable_project','uploaded':False,'released':False}
(root/'qa/package-delivery.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
