/* exported init */
/*
 * Copyright 2020-2024 Endless OS Foundation LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <http://www.gnu.org/licenses/>.
 */

const { Clutter, GObject, Meta, Shell, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

const Dialog = imports.ui.dialog;
const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;

const GNOME_SYSTEM_MONITOR_DESKTOP_ID = 'gnome-system-monitor.desktop';
const ICON_SIZE = 32;

const _ = imports.gettext.domain('force-quit-dialog-extension').gettext;

const ForceQuitDialogItem = GObject.registerClass({
    Signals: { 'selected': {} },
}, class ForceQuitDialogItem extends St.BoxLayout {
    _init(app) {
        super._init({
            style_class: 'force-quit-dialog-item',
            can_focus: true,
            reactive: true,
            track_hover: true,
        });
        this.app = app;

        this.connect('key-focus-in', () => this.emit('selected'));

        const action = new Clutter.ClickAction();
        action.connect('clicked', this.grab_key_focus.bind(this));
        this.add_action(action);

        this._icon = this.app.create_icon_texture(ICON_SIZE);
        this.add_child(this._icon);

        this._label = new St.Label({
            text: this.app.get_name(),
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.label_actor = this._label;
        this.add_child(this._label);
    }
});

var ForceQuitDialog = GObject.registerClass(
class ForceQuitDialog extends ModalDialog.ModalDialog {
    _init() {
        super._init({ styleClass: 'force-quit-dialog' });

        const content = new Dialog.MessageDialogContent({
            title: _('Force an App to Quit'),
            description: _("If an app isn't responding or cannot otherwise be closed, select the app's name and choose Force Quit. Any unsaved data will be lost."),
        });
        this.contentLayout.add_child(content);

        const scrollView = new St.ScrollView({
            style_class: 'force-quit-dialog-scroll-view',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            overlay_scrollbars: true,
            x_expand: true,
            y_expand: true,
        });
        this.contentLayout.add_child(scrollView);

        this._itemBox = new St.BoxLayout({ vertical: true });
        scrollView.add_actor(this._itemBox);

        this.addButton({
            action: this.close.bind(this),
            label: _('Cancel'),
            key: Clutter.KEY_Escape,
        });

        const appSystem = Shell.AppSystem.get_default();
        if (appSystem.lookup_app(GNOME_SYSTEM_MONITOR_DESKTOP_ID)) {
            this.addButton({
                action: this._launchSystemMonitor.bind(this),
                label: _('System Monitor'),
            });
        }

        this._quitButton = this.addButton({
            action: this._quitApp.bind(this),
            label: _('Force Quit'),
            key: Clutter.Return,
        });

        appSystem.get_running().forEach(app => {
            const item = new ForceQuitDialogItem(app);
            item.connect('selected', this._selectApp.bind(this));
            this._itemBox.add_child(item);
        });

        this._selectedAppItem = null;
        this._updateSensitivity();
    }

    _updateSensitivity() {
        const quitSensitive = this._selectedAppItem !== null;

        this._quitButton.reactive = quitSensitive;
        this._quitButton.can_focus = quitSensitive;
    }

    _launchSystemMonitor() {
        const appSystem = Shell.AppSystem.get_default();
        const systemMonitor = appSystem.lookup_app(GNOME_SYSTEM_MONITOR_DESKTOP_ID);
        systemMonitor.activate();

        this.close();
        Main.overview.hide();
    }

    _quitApp() {
        const app = this._selectedAppItem.app;
        for (let window of app.get_windows()) {
            window.kill();
        }
        this.close();
    }

    _selectApp(appItem) {
        if (this._selectedAppItem)
            this._selectedAppItem.remove_style_pseudo_class('selected');

        this._selectedAppItem = appItem;
        this._updateSensitivity();

        if (this._selectedAppItem)
            this._selectedAppItem.add_style_pseudo_class('selected');
    }
});

class Extension {
    constructor() {
        ExtensionUtils.initTranslations('force-quit-dialog-extension');
    }

    _showForceQuitDialog() {
        if (!Main.sessionMode.hasOverview)
            return;

        const dialog = new ForceQuitDialog();
        dialog.open();
    }

    enable() {
        Main.wm.addKeybinding(
            'show-force-quit-dialog',
            ExtensionUtils.getSettings(),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            this._showForceQuitDialog.bind(this));
    }

    disable() {
        Main.wm.removeKeybinding('show-force-quit-dialog');
    }
}

function init() {
    return new Extension();
}
