import urllib.request, json
from urllib.error import HTTPError
req=urllib.request.Request('http://127.0.0.1:8000/alumnos/?id=5', headers={'Content-Type':'application/json'}, method='GET')
try:
    resp=urllib.request.urlopen(req)
    print('STATUS', resp.getcode())
    print(resp.read().decode())
except HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode())
    except:
        print('No body')
except Exception as e:
    print('EX', e)
