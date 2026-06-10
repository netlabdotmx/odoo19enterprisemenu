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
