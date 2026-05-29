import json
import urllib.request
import urllib.error

BASE='http://127.0.0.1:8000'

def post_json(path, data):
    req = urllib.request.Request(BASE+path, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
    return urllib.request.urlopen(req)

def expect_http_error(label, path, data, expected_status):
    try:
        post_json(path, data)
        print(label, 'unexpected success')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(label, 'status', e.code)
        print(body)
        if e.code != expected_status:
            print(label, 'expected', expected_status, 'but got', e.code)

# 1) create admin
admin_payload = {
    'rol':'Administrador',
    'first_name':'UI',
    'last_name':'Test',
    'email':'ui_test@example.com',
    'password':'secret123',
    'clave_admin':'ADM123',
    'telefono':'1234567',
    'rfc':'XAXX010101000',
    'edad':30,
    'ocupacion':'Testing'
}

try:
    r = post_json('/admin/', admin_payload)
    print('Create admin status', r.getcode(), r.read().decode())
except urllib.error.HTTPError as e:
    print('Create admin HTTPError', e.code, e.read().decode())
except Exception as e:
    print('Create admin error', e)

expect_http_error(
    'Invalid admin names',
    '/admin/',
    {
        'rol':'Administrador',
        'first_name':'Ana Maria',
        'last_name':'Lopez Perez',
        'email':'invalid.admin@example.com',
        'password':'secret123',
        'clave_admin':'ADM124',
        'telefono':'1234567890',
        'rfc':'XAXX010101000',
        'edad':30,
        'ocupacion':'Testing'
    },
    400,
)

# 2) login
login_payload={'username':'ui_test@example.com','password':'secret123'}
try:
    req = urllib.request.Request(BASE+'/login/', data=json.dumps(login_payload).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
    r = urllib.request.urlopen(req)
    print('Login status', r.getcode())
    data=json.loads(r.read().decode())
    print('Login response', data)
    token = data.get('token') or data.get('auth_token') or data.get('key')
    if token:
        # 3) list admins
        req2 = urllib.request.Request(BASE+'/lista-admins/', headers={'Authorization':'Bearer '+token}, method='GET')
        r2 = urllib.request.urlopen(req2)
        print('List admins status', r2.getcode())
        print(r2.read().decode()[:2000])

        # 4) invalid maestro create should fail because id_trabajador has spaces / letters
        req3 = urllib.request.Request(
            BASE+'/maestros/',
            data=json.dumps({
                'rol':'Maestro',
                'first_name':'Test',
                'last_name':'Teacher',
                'email':'invalid.teacher@example.com',
                'password':'secret123',
                'id_trabajador':'T-100',
                'fecha_nacimiento':'1990-01-01',
                'telefono':'1234567890',
                'rfc':'RFCMAE001',
                'cubiculo':'C1',
                'area_investigacion':'AI',
                'materias_array':[],
                'sueldo_estimado':10000,
                'centro_universitario':'CU'
            }).encode('utf-8'),
            headers={'Content-Type':'application/json','Authorization':'Bearer '+token},
            method='POST'
        )
        try:
            urllib.request.urlopen(req3)
            print('Invalid maestro payload unexpectedly succeeded')
        except urllib.error.HTTPError as e:
            print('Invalid maestro status', e.code)
            print(e.read().decode())
    else:
        print('No token in login response')
except urllib.error.HTTPError as e:
    print('Login HTTPError', e.code, e.read().decode())
except Exception as e:
    print('Login error', e)
