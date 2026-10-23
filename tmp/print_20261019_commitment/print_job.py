from pathlib import Path
import sys,ssl,http.client,struct,json,uuid,hashlib,datetime

ROOT=Path(__file__).resolve().parent
PROFILE=json.loads(Path('C:/Users/Zwhao/.codex/printers/epson_l3250.json').read_text(encoding='utf-8-sig'))
IP=PROFILE['last_verified_ipv4']
URI=f'ipps://{IP}:631/ipp/print'
STATE=ROOT/'print_job.json'
PWG=ROOT/'commitment.pwg'

def attr(tag,name,value):
    name=name.encode('utf-8')
    if isinstance(value,str): value=value.encode('utf-8')
    elif isinstance(value,bool): value=bytes([int(value)])
    elif isinstance(value,int): value=struct.pack('!i',value)
    return bytes([tag])+struct.pack('!H',len(name))+name+struct.pack('!H',len(value))+value

def parse(data):
    if len(data)<8: raise RuntimeError('Short IPP response')
    code=struct.unpack_from('!H',data,2)[0]
    out={};pos=8;name='';group=0
    while pos<len(data):
        tag=data[pos];pos+=1
        if tag==3:break
        if tag<16:group=tag;continue
        n=struct.unpack_from('!H',data,pos)[0];pos+=2
        if n:name=data[pos:pos+n].decode('utf-8','replace');pos+=n
        n=struct.unpack_from('!H',data,pos)[0];pos+=2
        value=data[pos:pos+n];pos+=n
        if tag in (0x21,0x23):value=int.from_bytes(value,'big',signed=True)
        elif tag==0x22:value=bool(value[0])
        elif tag==0x32:value=list(struct.unpack('!IIB',value))
        else:value=value.decode('utf-8','replace')
        out.setdefault(name,[]).append(value)
    return code,out

def exchange(payload):
    # The certificate exception is scoped to the printer verified against the saved UUID.
    c=http.client.HTTPSConnection(IP,631,timeout=30,context=ssl._create_unverified_context())
    c.putrequest('POST','/ipp/print')
    c.putheader('Content-Type','application/ipp')
    c.putheader('Content-Length',str(len(payload)))
    c.endheaders()
    for i in range(0,len(payload),32768): c.send(payload[i:i+32768])
    r=c.getresponse();data=r.read();c.close()
    if r.status!=200:raise RuntimeError(f'HTTP {r.status}')
    code,attrs=parse(data)
    if code>0xff:raise RuntimeError(json.dumps({'ipp_status':hex(code),'attrs':attrs},ensure_ascii=False))
    return code,attrs

def base(operation):
    return (struct.pack('!BBHI',2,0,operation,1)+b'\x01'
        +attr(0x47,'attributes-charset','utf-8')
        +attr(0x48,'attributes-natural-language','en')
        +attr(0x45,'printer-uri',URI))

def verify_printer():
    code,attrs=exchange(base(11)+attr(0x44,'requested-attributes','all')+b'\x03')
    assert attrs['printer-make-and-model']==[PROFILE['display_name']], attrs.get('printer-make-and-model')
    assert attrs['printer-uuid']==['urn:uuid:'+PROFILE['mdns_printer_uuid']],attrs.get('printer-uuid')
    assert attrs['printer-is-accepting-jobs']==[True]
    assert attrs['printer-state'][0] in (3,4),attrs.get('printer-state-reasons')
    return {k:attrs.get(k) for k in ('printer-make-and-model','printer-uuid','printer-state','printer-state-reasons')}

def job_payload(operation,name):
    return (base(operation)+attr(0x42,'requesting-user-name','Codex')
        +attr(0x42,'job-name',name)
        +attr(0x49,'document-format','image/pwg-raster')
        +attr(0x22,'ipp-attribute-fidelity',True)
        +b'\x02'+attr(0x21,'copies',1)
        +attr(0x44,'media','iso_a4_210x297mm')
        +attr(0x44,'sides','one-sided')
        +attr(0x44,'print-color-mode','monochrome')
        +attr(0x32,'printer-resolution',struct.pack('!IIB',360,360,3))+b'\x03')

def save(d):STATE.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')

cmd=sys.argv[1]
if cmd=='validate':
    printer=verify_printer()
    code,attrs=exchange(job_payload(4,'commitment-validation'))
    assert code==0,(code,attrs)
    print(json.dumps({'printer':printer,'validation':'successful','settings':{'paper':'A4','sides':'one-sided','color':'monochrome','copies':1,'pages':1}},ensure_ascii=False))
elif cmd=='submit':
    if STATE.exists():raise RuntimeError('A submission record exists. Check status; do not resubmit blindly.')
    printer=verify_printer()
    name='commitment-20261019-'+uuid.uuid4().hex[:10]
    raster=PWG.read_bytes()
    record={'job_name':name,'printer_ip':IP,'printer_uuid':PROFILE['mdns_printer_uuid'],'expected_pages':1,'copies':1,'sha256':hashlib.sha256(raster).hexdigest(),'state':'submission-started','created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    save(record)
    try:
        code,attrs=exchange(job_payload(2,name)+raster)
        record.update({'state':'submitted','ipp_status':code,'job_id':attrs.get('job-id',[None])[0],'job_uri':attrs.get('job-uri',[None])[0],'submission_response':attrs})
        save(record)
        print(json.dumps(record,ensure_ascii=False))
    except Exception as e:
        record.update({'state':'submission-uncertain','error':str(e)});save(record);raise
elif cmd=='status':
    record=json.loads(STATE.read_text(encoding='utf-8'))
    assert record.get('job_id'), 'Submission uncertain: use Get-Jobs and job_name to recover; do not resend.'
    code,attrs=exchange(base(9)+attr(0x21,'job-id',record['job_id'])+attr(0x42,'requesting-user-name','Codex')+attr(0x44,'requested-attributes','all')+b'\x03')
    keys=['job-id','job-name','job-state','job-state-reasons','job-impressions','job-impressions-completed','job-media-sheets-completed']
    status={k:attrs.get(k) for k in keys}
    record['latest_status']=status
    if attrs.get('job-state')==[9] and attrs.get('job-impressions-completed')==[1]:record['state']='verified-complete'
    save(record);print(json.dumps({'state':record['state'],'status':status},ensure_ascii=False))
else:raise ValueError(cmd)
