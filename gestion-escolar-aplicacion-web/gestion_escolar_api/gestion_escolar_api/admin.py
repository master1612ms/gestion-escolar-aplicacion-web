from django import forms
from django.contrib import admin
from django.contrib.admin.sites import NotRegistered

from gestion_escolar_api.models import Administradores, Maestros

RFC_INPUT_ATTRS = {
    "pattern": "[A-Za-z0-9]+",
    "title": "Solo letras y números, sin espacios",
    "autocomplete": "off",
    "spellcheck": "false",
    "inputmode": "latin",
    "maxlength": "13",
    "onkeydown": "if (event.key === ' ') { event.preventDefault(); return false; }",
    "onbeforeinput": "if (event.data && /[^A-Za-z0-9]/.test(event.data)) { event.preventDefault(); return false; }",
    "onpaste": "event.preventDefault(); const text = (event.clipboardData || window.clipboardData).getData('text'); this.value = text.replace(/[^A-Za-z0-9]/g,''); this.dispatchEvent(new Event('input', { bubbles: true }));",
    "oninput": "this.value=this.value.replace(/[^A-Za-z0-9]/g,'')",
}

NUMBER_INPUT_ATTRS = {
    "pattern": "[0-9]+",
    "title": "Solo números, sin espacios",
    "autocomplete": "off",
    "spellcheck": "false",
    "inputmode": "numeric",
    "onkeydown": "if (event.key === ' ') { event.preventDefault(); return false; } if (event.key && /[^0-9]/.test(event.key) && event.key.length === 1) { event.preventDefault(); return false; }",
    "onbeforeinput": "if (event.data && /[^0-9]/.test(event.data)) { event.preventDefault(); return false; }",
    "onpaste": "event.preventDefault(); const text = (event.clipboardData || window.clipboardData).getData('text'); this.value = text.replace(/[^0-9]/g,''); this.dispatchEvent(new Event('input', { bubbles: true }));",
    "oninput": "this.value=this.value.replace(/[^0-9]/g,'')",
}

NAME_INPUT_ATTRS = {
    "pattern": "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+",
    "title": "Solo letras, sin espacios",
    "autocomplete": "off",
    "spellcheck": "false",
    "inputmode": "text",
    "onkeydown": "if (event.key === ' ') { event.preventDefault(); return false; }",
    "onbeforeinput": "if (event.data && /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(event.data)) { event.preventDefault(); return false; }",
    "onpaste": "event.preventDefault(); const text = (event.clipboardData || window.clipboardData).getData('text'); this.value = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,''); this.dispatchEvent(new Event('input', { bubbles: true }));",
    "oninput": "this.value=this.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,'')",
}

class AdministradoresAdminForm(forms.ModelForm):
    class Meta:
        model = Administradores
        fields = "__all__"
        widgets = {
            "rfc": forms.TextInput(attrs=RFC_INPUT_ATTRS),
            "user": forms.Select(),
        }

class MaestrosAdminForm(forms.ModelForm):
    class Meta:
        model = Maestros
        fields = "__all__"
        widgets = {
            "rfc": forms.TextInput(attrs=RFC_INPUT_ATTRS),
            "id_trabajador": forms.TextInput(attrs=NUMBER_INPUT_ATTRS),
        }

class AdministradoresAdmin(admin.ModelAdmin):
    form = AdministradoresAdminForm
    list_display = ("id", "user", "creation", "update")
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")

    class Media:
        js = ("gestion_escolar_api/admin_rfc_guard.js",)

class MaestrosAdmin(admin.ModelAdmin):
    form = MaestrosAdminForm
    list_display = ("id", "user", "creation", "update")
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")

    class Media:
        js = ("gestion_escolar_api/admin_rfc_guard.js",)


for model, admin_class in (
    (Administradores, AdministradoresAdmin),
    (Maestros, MaestrosAdmin),
):
    try:
        admin.site.unregister(model)
    except NotRegistered:
        pass
    admin.site.register(model, admin_class)

