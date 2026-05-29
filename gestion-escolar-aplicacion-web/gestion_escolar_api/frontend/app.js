const BASE = 'http://127.0.0.1:8000';

function sanitizeCodeValue(value){
  return String(value || '').replace(/[^A-Za-z0-9]/g, '');
}

function sanitizeNumberValue(value){
  return String(value || '').replace(/[^0-9]/g, '');
}

function sanitizeNameValue(value){
  return String(value || '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
}

function attachInputGuard(selector, sanitize, attrs){
  const fields = document.querySelectorAll(selector);
  fields.forEach((field) => {
    if (field.dataset.inputGuardAttached === '1') return;
    field.dataset.inputGuardAttached = '1';
    Object.entries(attrs || {}).forEach(([key, value]) => field.setAttribute(key, value));

    const normalize = () => {
      const cleaned = sanitize(field.value);
      if (field.value !== cleaned) {
        field.value = cleaned;
      }
    };

    field.addEventListener('input', normalize);
    field.addEventListener('change', normalize);
    field.addEventListener('paste', (event) => {
      event.preventDefault();
      const pasted = event.clipboardData ? event.clipboardData.getData('text') : '';
      field.value = sanitize(pasted);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

function attachCodeGuards(){
  attachInputGuard(
    'input[name="rfc"], input[id="rfc"], input[id="admin_rfc"], input[id="maestro_rfc"], input[id="alumno_curp"], input[name="curp"], input[id="curp"]',
    sanitizeCodeValue,
    {
      autocomplete: 'off',
      spellcheck: 'false',
      inputmode: 'latin',
      pattern: '[A-Za-z0-9]+',
      title: 'Solo letras y números, sin espacios',
    }
  );

  attachInputGuard(
    'input[name="id_trabajador"], input[id="id_trabajador"], input[id="maestro_id_trabajador"], input[id="alumno_matricula"], input[name="matricula"], input[id="matricula"]',
    sanitizeNumberValue,
    {
      autocomplete: 'off',
      spellcheck: 'false',
      inputmode: 'numeric',
      pattern: '[0-9]+',
      title: 'Solo números, sin espacios',
    }
  );

  attachInputGuard(
    'input[name="first_name"], input[id="first_name"], input[id="admin_first_name"], input[id="admin_last_name"], input[id="maestro_first_name"], input[id="maestro_last_name"], input[id="alumno_first_name"], input[id="alumno_last_name"], input[name="last_name"]',
    sanitizeNameValue,
    {
      autocomplete: 'off',
      spellcheck: 'false',
      inputmode: 'text',
      pattern: '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+',
      title: 'Solo letras, sin espacios',
    }
  );
}

function watchForCodeFields(){
  if (!window.MutationObserver) return;
  const observer = new MutationObserver(() => attachCodeGuards());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function out(v){ document.getElementById('output').textContent = typeof v==='string'?v:JSON.stringify(v,null,2); }
function dashboardOut(v){ document.getElementById('dashboardOutput').textContent = typeof v==='string'?v:JSON.stringify(v,null,2); }

function showOnly(role){
  const adminSection = document.getElementById('adminSection');
  const maestroSection = document.getElementById('maestroSection');
  const alumnoSection = document.getElementById('alumnoSection');
  adminSection.classList.add('hidden');
  maestroSection.classList.add('hidden');
  alumnoSection.classList.add('hidden');
  if(role === 'administrador') adminSection.classList.remove('hidden');
  if(role === 'maestro') maestroSection.classList.remove('hidden');
  if(role === 'alumno') alumnoSection.classList.remove('hidden');
}

attachCodeGuards();
watchForCodeFields();

function renderList(targetId, items, emptyText){
  const target = document.getElementById(targetId);
  if(!items || !items.length){
    target.innerHTML = `<p class="muted">${emptyText}</p>`;
    return;
  }
  const rows = items.map(item => `<li>${typeof item === 'string' ? item : JSON.stringify(item)}</li>`).join('');
  target.innerHTML = `<ul class="list">${rows}</ul>`;
}

function fillMaestroForm(data){
  if(!data) return;
  document.getElementById('maestro_id').value = data.id ?? '';
  document.getElementById('maestro_rol').value = data.rol || 'Maestro';
  document.getElementById('maestro_first_name').value = data.user?.first_name || data.first_name || '';
  document.getElementById('maestro_last_name').value = data.user?.last_name || data.last_name || '';
  document.getElementById('maestro_email').value = data.user?.email || data.email || '';
  document.getElementById('maestro_id_trabajador').value = data.id_trabajador || '';
  document.getElementById('maestro_fecha_nacimiento').value = data.fecha_nacimiento || '';
  document.getElementById('maestro_telefono').value = data.telefono || '';
  document.getElementById('maestro_rfc').value = data.rfc || '';
  document.getElementById('maestro_cubiculo').value = data.cubiculo || '';
  document.getElementById('maestro_area_investigacion').value = data.area_investigacion || '';
  document.getElementById('maestro_sueldo_estimado').value = data.sueldo_estimado || '';
  document.getElementById('maestro_centro_universitario').value = data.centro_universitario || '';
  const materias = data.materias_array;
  document.getElementById('maestro_materias_array').value = Array.isArray(materias) ? JSON.stringify(materias) : (materias || '[]');
}

function fillAlumnoForm(data){
  if(!data) return;
  document.getElementById('alumno_id').value = data.id ?? '';
  document.getElementById('alumno_rol').value = data.rol || 'Alumno';
  document.getElementById('alumno_first_name').value = data.user?.first_name || data.first_name || '';
  document.getElementById('alumno_last_name').value = data.user?.last_name || data.last_name || '';
  document.getElementById('alumno_email').value = data.user?.email || data.email || '';
  document.getElementById('alumno_matricula').value = data.matricula || '';
  document.getElementById('alumno_carrera').value = data.carrera || '';
  document.getElementById('alumno_semestre').value = data.semestre || '';
  document.getElementById('alumno_promedio').value = data.promedio ?? '';
  document.getElementById('alumno_curp').value = data.curp || '';
  document.getElementById('alumno_fecha_nacimiento').value = data.fecha_nacimiento || '';
  document.getElementById('alumno_edad').value = data.edad ?? '';
  document.getElementById('alumno_telefono').value = data.telefono || '';
  document.getElementById('alumno_direccion').value = data.direccion || '';
  document.getElementById('alumno_genero').value = data.genero || '';
  const materias = data.materias_array;
  document.getElementById('alumno_materias_array').value = Array.isArray(materias) ? JSON.stringify(materias) : (materias || '[]');
}

function parseJsonArrayField(elementId){
  const value = document.getElementById(elementId).value;
  try{
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  }catch(err){
    return [];
  }
}

function getEmptyFields(fieldIds){
  return fieldIds.filter((fieldId) => !String(document.getElementById(fieldId).value || '').trim());
}

async function loginAndLoad(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  out('Iniciando login...');
  try{
    const res = await fetch(`${BASE}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    const data = await res.json();
    if(!res.ok){ out({status: res.status, body: data}); return; }
    const token = data.token || data.auth_token || data.key;
    if(!token){ out({error: 'No se recibió token', data}); return; }
    window.currentSessionData = data;
    localStorage.setItem('token', token);
    document.getElementById('roleBadge').textContent = data.rol || 'sin rol';
    document.getElementById('roleBadge').classList.remove('hidden');
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('dashboardCard').classList.remove('hidden');
    showOnly(data.rol);
    dashboardOut({login: data});
    await loadRoleSection(token, data);
  }catch(err){ out({error: err.message}); }
}

async function loadRoleSection(token, data){
  const role = (data.rol || '').toLowerCase();
  try{
    if(role === 'administrador'){
      dashboardOut('Cargando administradores y totales...');
      const [adminsRes, totalsRes] = await Promise.all([
        fetch(`${BASE}/lista-admins/`, { headers: { 'Authorization': 'Bearer '+token } }),
        fetch(`${BASE}/total-usuarios/`, { headers: { 'Authorization': 'Bearer '+token } })
      ]);
      const admins = await adminsRes.json();
      const totals = await totalsRes.json();
      renderList('adminData', admins, 'No hay administradores registrados.');
      dashboardOut({administradores: admins, totales: totals});
      return;
    }
    if(role === 'maestro'){
      dashboardOut('Cargando maestros...');
      const res = await fetch(`${BASE}/lista-maestros/`, {
        headers: { 'Authorization': 'Bearer '+token }
      });
      const json = await res.json();
      if(!res.ok){ dashboardOut({status: res.status, body: json}); return; }
      renderList('maestroData', json, 'No hay maestros registrados.');
      fillMaestroForm(data);
      dashboardOut({maestros: json});
      return;
    }
    if(role === 'alumno'){
      const alumnoData = [
        `Nombre: ${data.first_name || ''} ${data.last_name || ''}`.trim(),
        `Correo: ${data.email || ''}`,
        `Matrícula: ${data.matricula || 'No disponible'}`
      ];
      renderList('alumnoData', alumnoData, 'Sin datos del alumno.');
      fillAlumnoForm(data);
      dashboardOut({alumno: data});
      return;
    }
    dashboardOut({error: 'Rol no reconocido', data});
  }catch(err){ dashboardOut({error: err.message}); }
}

async function loadAdmins(token){
  out('Cargando administradores...');
  try{
    const res = await fetch(`${BASE}/lista-admins/`, {
      headers: { 'Authorization': 'Bearer '+token }
    });
    const json = await res.json();
    if(!res.ok){ out({status: res.status, body: json}); return; }
    out({administradores: json});
  }catch(err){ out({error: err.message}); }
}

document.getElementById('btnLogin').addEventListener('click', loginAndLoad);
document.getElementById('btnShowToken').addEventListener('click', ()=>{
  out({token: localStorage.getItem('token')});
});

// Admin form handlers
async function adminCreate(){
  const missingFields = getEmptyFields([
    'admin_first_name', 'admin_last_name', 'admin_email', 'admin_password',
    'admin_clave_admin', 'admin_telefono', 'admin_rfc', 'admin_edad',
    'admin_ocupacion', 'admin_jornada', 'admin_grado_academico'
  ]);
  if (missingFields.length) {
    document.getElementById('adminFormOutput').textContent = JSON.stringify({
      error: 'Faltan campos requeridos en el formulario de admin',
      campos_faltantes: missingFields
    }, null, 2);
    return;
  }

  const payload = {
    rol: document.getElementById('admin_rol').value,
    first_name: document.getElementById('admin_first_name').value,
    last_name: document.getElementById('admin_last_name').value,
    email: document.getElementById('admin_email').value,
    password: document.getElementById('admin_password').value,
    clave_admin: document.getElementById('admin_clave_admin').value,
    telefono: document.getElementById('admin_telefono').value,
    rfc: String(document.getElementById('admin_rfc').value || '').toUpperCase(),
    edad: document.getElementById('admin_edad').value,
    ocupacion: document.getElementById('admin_ocupacion').value,
    jornada: document.getElementById('admin_jornada').value,
    grado_academico: document.getElementById('admin_grado_academico').value,
  };
  try{
    const res = await fetch(`${BASE}/admin/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('adminFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('adminFormOutput').textContent = err.message }
}

async function adminUpdate(){
  const payload = {
    id: document.getElementById('admin_id').value,
    first_name: document.getElementById('admin_first_name').value,
    last_name: document.getElementById('admin_last_name').value,
    clave_admin: document.getElementById('admin_clave_admin').value,
    telefono: document.getElementById('admin_telefono').value,
    rfc: document.getElementById('admin_rfc').value,
    edad: document.getElementById('admin_edad').value,
    ocupacion: document.getElementById('admin_ocupacion').value,
    jornada: document.getElementById('admin_jornada').value,
    grado_academico: document.getElementById('admin_grado_academico').value,
  };
  try{
    const res = await fetch(`${BASE}/admin/`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('adminFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('adminFormOutput').textContent = err.message }
}

document.getElementById('btnAdminCreate').addEventListener('click', adminCreate);
document.getElementById('btnAdminUpdate').addEventListener('click', adminUpdate);

// Maestro form handlers
async function maestroCreate(){
  const missingFields = getEmptyFields([
    'maestro_first_name', 'maestro_last_name', 'maestro_email', 'maestro_password',
    'maestro_id_trabajador', 'maestro_fecha_nacimiento', 'maestro_telefono',
    'maestro_rfc', 'maestro_cubiculo', 'maestro_area_investigacion',
    'maestro_sueldo_estimado', 'maestro_centro_universitario', 'maestro_materias_array'
  ]);
  if (missingFields.length) {
    document.getElementById('maestroFormOutput').textContent = JSON.stringify({
      error: 'Faltan campos requeridos en el formulario de maestro',
      campos_faltantes: missingFields
    }, null, 2);
    return;
  }

  const payload = {
    rol: document.getElementById('maestro_rol').value,
    first_name: document.getElementById('maestro_first_name').value,
    last_name: document.getElementById('maestro_last_name').value,
    email: document.getElementById('maestro_email').value,
    password: document.getElementById('maestro_password').value,
    id_trabajador: document.getElementById('maestro_id_trabajador').value,
    fecha_nacimiento: document.getElementById('maestro_fecha_nacimiento').value,
    telefono: document.getElementById('maestro_telefono').value,
    rfc: String(document.getElementById('maestro_rfc').value || '').toUpperCase(),
    cubiculo: document.getElementById('maestro_cubiculo').value,
    area_investigacion: document.getElementById('maestro_area_investigacion').value,
    sueldo_estimado: document.getElementById('maestro_sueldo_estimado').value,
    centro_universitario: document.getElementById('maestro_centro_universitario').value,
    materias_array: (()=>{ try{ return JSON.parse(document.getElementById('maestro_materias_array').value||'[]') }catch(e){ return [] } })(),
  };
  try{
    const res = await fetch(`${BASE}/maestros/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('maestroFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('maestroFormOutput').textContent = err.message }
}

async function maestroUpdate(){
  const payload = {
    id: document.getElementById('maestro_id').value,
    first_name: document.getElementById('maestro_first_name').value,
    last_name: document.getElementById('maestro_last_name').value,
    id_trabajador: document.getElementById('maestro_id_trabajador').value,
    fecha_nacimiento: document.getElementById('maestro_fecha_nacimiento').value,
    telefono: document.getElementById('maestro_telefono').value,
    rfc: document.getElementById('maestro_rfc').value,
    cubiculo: document.getElementById('maestro_cubiculo').value,
    area_investigacion: document.getElementById('maestro_area_investigacion').value,
    sueldo_estimado: document.getElementById('maestro_sueldo_estimado').value,
    centro_universitario: document.getElementById('maestro_centro_universitario').value,
    materias_array: (()=>{ try{ return JSON.parse(document.getElementById('maestro_materias_array').value||'[]') }catch(e){ return [] } })(),
  };
  try{
    const res = await fetch(`${BASE}/maestros/`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('maestroFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('maestroFormOutput').textContent = err.message }
}

document.getElementById('btnMaestroCreate').addEventListener('click', maestroCreate);
document.getElementById('btnMaestroUpdate').addEventListener('click', maestroUpdate);

// Alumno form handlers
async function alumnoCreate(){
  const missingFields = getEmptyFields([
    'alumno_first_name', 'alumno_last_name', 'alumno_email', 'alumno_password',
    'alumno_matricula', 'alumno_carrera', 'alumno_semestre', 'alumno_promedio',
    'alumno_curp', 'alumno_fecha_nacimiento', 'alumno_edad', 'alumno_telefono',
    'alumno_materias_array', 'alumno_direccion', 'alumno_genero'
  ]);
  if (missingFields.length) {
    document.getElementById('alumnoFormOutput').textContent = JSON.stringify({
      error: 'Faltan campos requeridos en el formulario de alumno',
      campos_faltantes: missingFields
    }, null, 2);
    return;
  }

  const payload = {
    rol: document.getElementById('alumno_rol').value,
    first_name: document.getElementById('alumno_first_name').value,
    last_name: document.getElementById('alumno_last_name').value,
    email: document.getElementById('alumno_email').value,
    password: document.getElementById('alumno_password').value,
    matricula: document.getElementById('alumno_matricula').value,
    carrera: document.getElementById('alumno_carrera').value,
    semestre: document.getElementById('alumno_semestre').value,
    promedio: document.getElementById('alumno_promedio').value,
    curp: String(document.getElementById('alumno_curp').value || '').toUpperCase(),
    fecha_nacimiento: document.getElementById('alumno_fecha_nacimiento').value,
    edad: document.getElementById('alumno_edad').value,
    telefono: document.getElementById('alumno_telefono').value,
    materias_array: parseJsonArrayField('alumno_materias_array'),
    direccion: document.getElementById('alumno_direccion').value,
    genero: document.getElementById('alumno_genero').value,
  };
  try{
    const res = await fetch(`${BASE}/alumnos/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('alumnoFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('alumnoFormOutput').textContent = err.message }
}

async function alumnoUpdate(){
  const payload = {
    id: document.getElementById('alumno_id').value,
    first_name: document.getElementById('alumno_first_name').value,
    last_name: document.getElementById('alumno_last_name').value,
    email: document.getElementById('alumno_email').value,
    matricula: document.getElementById('alumno_matricula').value,
    carrera: document.getElementById('alumno_carrera').value,
    semestre: document.getElementById('alumno_semestre').value,
    promedio: document.getElementById('alumno_promedio').value,
    curp: String(document.getElementById('alumno_curp').value || '').toUpperCase(),
    fecha_nacimiento: document.getElementById('alumno_fecha_nacimiento').value,
    edad: document.getElementById('alumno_edad').value,
    telefono: document.getElementById('alumno_telefono').value,
    materias_array: parseJsonArrayField('alumno_materias_array'),
    direccion: document.getElementById('alumno_direccion').value,
    genero: document.getElementById('alumno_genero').value,
  };
  try{
    const res = await fetch(`${BASE}/alumnos/`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const body = await res.json();
    document.getElementById('alumnoFormOutput').textContent = JSON.stringify({status: res.status, body}, null, 2);
  }catch(err){ document.getElementById('alumnoFormOutput').textContent = err.message }
}

document.getElementById('btnAlumnoCreate').addEventListener('click', alumnoCreate);
document.getElementById('btnAlumnoUpdate').addEventListener('click', alumnoUpdate);
