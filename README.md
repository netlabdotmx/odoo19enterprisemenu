# App Menu Enterprise Style — Odoo 19 Community

Módulo que reemplaza el dropdown de aplicaciones del navbar por un overlay fullscreen estilo Odoo Enterprise, con grid de íconos, animaciones y cierre con Escape o click fuera.

---

## Estructura de archivos

```
app_menu_enterprise/
├── __init__.py
├── __manifest__.py
└── static/src/
    ├── xml/navbar_patch.xml
    ├── js/home_menu.js
    └── scss/home_menu.scss
```

---

## `__init__.py`

```python
# -*- coding: utf-8 -*-
```

Sin modelos Python. Todo el módulo es frontend.

---

## `__manifest__.py`

```python
{
    'name': 'App Menu Enterprise Style',
    'version': '19.0.1.0.0',
    'category': 'Hidden/Tools',
    'summary': 'Menú de apps estilo Enterprise con overlay fullscreen',
    'description': """
        Reemplaza el dropdown de apps del navbar con un overlay fullscreen
        que muestra los íconos de las aplicaciones en un grid estético,
        similar a Odoo Enterprise.
    """,
    'depends': ['web'],
    'assets': {
        'web.assets_backend': [
            'app_menu_enterprise/static/src/xml/navbar_patch.xml',
            'app_menu_enterprise/static/src/js/home_menu.js',
            'app_menu_enterprise/static/src/scss/home_menu.scss',
        ],
    },
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
```

> No depende de ningún módulo personalizado. Solo requiere `web`.

---

## `static/src/js/home_menu.js`

Patch del componente `NavBar` de OWL. Agrega estado reactivo `isHomeMenuOpen` y 3 métodos de control.

```js
/** @odoo-module **/
import { NavBar } from "@web/webclient/navbar/navbar";
import { patch } from "@web/core/utils/patch";
import { useExternalListener } from "@odoo/owl";

patch(NavBar.prototype, {
    setup() {
        super.setup(...arguments);
        this.state.isHomeMenuOpen = false;
        useExternalListener(window, "keydown", (ev) => {
            if (ev.key === "Escape" && this.state.isHomeMenuOpen) {
                ev.preventDefault();
                ev.stopPropagation();
                this.state.isHomeMenuOpen = false;
            }
        });
    },
    toggleHomeMenu() {
        this.state.isHomeMenuOpen = !this.state.isHomeMenuOpen;
    },
    closeHomeMenu() {
        this.state.isHomeMenuOpen = false;
    },
    onHomeMenuAppClick(app) {
        this.state.isHomeMenuOpen = false;
        this.onNavBarDropdownItemSelection(app);
    },
});
```

**Puntos clave:**
- Siempre llamar `super.setup(...arguments)` antes de agregar lógica propia
- `this.state` en OWL es reactivo: cualquier cambio re-renderiza el template automáticamente
- `useExternalListener` registra el listener en `window` y lo limpia automáticamente al destruir el componente
- `onNavBarDropdownItemSelection(app)` es el método interno de Odoo que maneja la navegación a una app

---

## `static/src/xml/navbar_patch.xml`

Herencia del template `web.NavBar.AppsMenu` con `t-inherit-mode="extension"` y `<xpath>` para modificar solo el nodo necesario sin reemplazar todo el template.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">
    <t t-name="web.NavBar.AppsMenu" t-inherit="web.NavBar.AppsMenu" t-inherit-mode="extension">
        <xpath expr="//t[@t-else='']" position="replace">
            <t t-else="">
                <div t-if="!isScopedApp" class="o_navbar_apps_menu">
                    <button class="o_home_menu_btn" data-hotkey="h" title="Home Menu"
                            t-on-click="toggleHomeMenu">
                        <i class="oi oi-apps"/>
                    </button>
                </div>
                <div t-else="" class="mx-2"/>
                <t t-portal="'body'">
                    <div t-if="state.isHomeMenuOpen" class="o_home_menu_overlay"
                         t-on-click.self="closeHomeMenu">
                        <div class="o_home_menu_backdrop" t-on-click="closeHomeMenu"/>
                        <div class="o_home_menu_container">
                            <div class="o_home_menu_scrollable">
                                <a t-foreach="menuService.getApps()" t-as="app" t-key="app.id"
                                   class="o_home_menu_app"
                                   t-att-href="getMenuItemHref(app)"
                                   t-att-data-menu-xmlid="app.xmlid"
                                   t-att-data-section="app.id"
                                   t-on-click.prevent="() => this.onHomeMenuAppClick(app)">
                                    <div class="o_home_menu_app_icon">
                                        <img t-if="app.webIconData"
                                             t-att-src="app.webIconData"
                                             t-att-alt="app.name"/>
                                        <div t-else="" class="o_home_menu_app_icon_placeholder">
                                            <i class="fa fa-cube"/>
                                        </div>
                                    </div>
                                    <span class="o_home_menu_app_label" t-esc="app.name"/>
                                </a>
                            </div>
                        </div>
                    </div>
                </t>
            </t>
        </xpath>
    </t>
</templates>
```

**Puntos clave:**
- `t-inherit="web.NavBar.AppsMenu"` — nombre exacto del template original de Odoo
- `t-inherit-mode="extension"` — extiende en vez de reemplazar
- `xpath expr="//t[@t-else='']"` — busca el nodo `<t t-else="">` dentro del template original
- `position="replace"` — reemplaza ese nodo con el contenido nuevo
- `<t t-portal="'body'">` — el overlay se renderiza directamente en `<body>`, necesario para que `position: fixed` y `z-index` funcionen correctamente desde dentro del navbar
- `t-on-click.self` — solo dispara si el click es directamente en ese elemento, no en sus hijos

---

## `static/src/scss/home_menu.scss`

```scss
.o_navbar_apps_menu {
    display: flex;
    align-items: center;
    height: 100%;
}

.o_home_menu_btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: inherit;
    width: 40px;
    height: 40px;
    padding: 0;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, transform 0.15s;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.08);
    }
    &:active {
        transform: scale(0.94);
    }

    .oi-apps {
        font-size: 1.3rem;
        line-height: 1;
    }
}

.o_home_menu_overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: homeMenuFadeIn 0.2s ease-out;
}

.o_home_menu_backdrop {
    position: absolute;
    inset: 0;
    background: rgba(20, 20, 40, 0.85);
    backdrop-filter: blur(24px) saturate(1.3);
    -webkit-backdrop-filter: blur(24px) saturate(1.3);
}

.o_home_menu_container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1040px;
    max-height: 85vh;
    padding: 3rem 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
        border-radius: 4px;
    }
}

.o_home_menu_scrollable {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 2rem 1.5rem;
    justify-items: center;
    padding: 1rem 3rem;
}

.o_home_menu_app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem;
    border-radius: 16px;
    text-decoration: none !important;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    width: 110px;
    animation: homeMenuItemPop 0.32s ease-out both;

    @for $i from 1 through 30 {
        &:nth-child(#{$i}) {
            animation-delay: #{$i * 0.025}s;
        }
    }

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-3px);

        .o_home_menu_app_icon {
            transform: scale(1.08);
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.1);
        }
        .o_home_menu_app_label { color: #fff; }
    }

    &:active { transform: scale(0.96); }
}

.o_home_menu_app_icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
    background: #ffffff;

    img { width: 44px; height: 44px; object-fit: contain; }
}

.o_home_menu_app_icon_placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #7C3AED, #4F46E5);
    color: #fff;
    font-size: 1.6rem;
}

.o_home_menu_app_label {
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.78);
    text-align: center;
    line-height: 1.2;
    max-width: 105px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.2s;
    letter-spacing: 0.01em;
}

@keyframes homeMenuFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes homeMenuItemPop {
    from { opacity: 0; transform: translateY(20px) scale(0.88); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Responsive */
@media (max-width: 768px) {
    .o_home_menu_scrollable { grid-template-columns: repeat(3, 1fr); gap: 1.25rem 0.75rem; }
    .o_home_menu_app { width: 90px; padding: 0.5rem; }
    .o_home_menu_app_icon { width: 52px; height: 52px; border-radius: 14px; img { width: 36px; height: 36px; } }
    .o_home_menu_app_label { font-size: 0.65rem; }
    .o_home_menu_container { padding: 1.5rem 1rem; }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .o_home_menu_scrollable { grid-template-columns: repeat(4, 1fr); gap: 1.5rem 1rem; }
}

@media (min-width: 1400px) {
    .o_home_menu_scrollable { grid-template-columns: repeat(6, 1fr); gap: 2.25rem 1.75rem; }
    .o_home_menu_app { width: 130px; }
    .o_home_menu_app_icon { width: 72px; height: 72px; border-radius: 18px; img { width: 50px; height: 50px; } }
    .o_home_menu_app_label { font-size: 0.8rem; }
}
```

**Puntos clave del diseño:**
- `backdrop-filter: blur(24px)` — efecto cristal esmerilado en el fondo
- CSS Grid con `repeat(6, 1fr)` — 6 columnas en escritorio, responsive a 4 y 3
- Animación escalonada: cada app aparece con `animation-delay: n * 0.025s` usando `@for` de SCSS
- `t-portal="'body'"` en el XML es indispensable para que el `position: fixed` funcione dentro del navbar

---

## Instalación

```bash
# 1. Copiar al directorio de addons
cp -r app_menu_enterprise/ /opt/odoo/extra-addons/

# 2. Verificar addons_path en /etc/odoo/odoo.conf
grep addons_path /etc/odoo/odoo.conf
# Debe incluir /opt/odoo/extra-addons

# 3. Reiniciar Odoo
systemctl restart odoo

# 4. En Odoo: Ajustes → Activar modo desarrollador → Apps → instalar "App Menu Enterprise Style"
```
