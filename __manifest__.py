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
