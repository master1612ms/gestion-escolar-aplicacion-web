import urllib.request, json
from urllib.error import HTTPError
import time
email = f'test.student+{int(time.time())}@example.com'
payload = {'rol':'alumno','first_name':'Test','last_name':'Student','email':email,'password':'pass1234','matricula':'000006','curp':'ABCD123456EFGHIJKL','fecha_nacimiento':'2004-05-20','edad':21,'telefono':'0000000000','materias_array':['Aplicaciones Web','Programación 1']}
data=json.dumps(payload).encode()
req=urllib.request.Request('http://127.0.0.1:8000/alumnos/', data=data, headers={'Content-Type':'application/json'}, method='POST')
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
