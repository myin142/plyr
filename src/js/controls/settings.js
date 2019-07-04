import controls from '../controls';
import {
    createElement,
    getAttributesFromSelector,
} from '../utils/elements';
import { on } from '../utils/events';
import i18n from '../utils/i18n';
import { extend } from '../utils/objects';

const settings = {

    createSettingsMenu(data, defaultAttributes) {
        const wrapper = createElement(
            'div',
            extend({}, defaultAttributes, {
                class: `${defaultAttributes.class} plyr__menu`.trim(),
                hidden: '',
            }),
        );

        wrapper.appendChild(
            controls.createButton.call(this, 'settings', {
                'aria-haspopup': true,
                'aria-controls': `plyr-settings-${data.id}`,
                'aria-expanded': false,
            }),
        );

        const popup = createElement('div', {
            class: 'plyr__menu__container',
            id: `plyr-settings-${data.id}`,
            hidden: '',
        });

        const inner = createElement('div');

        const home = createElement('div', {
            id: `plyr-settings-${data.id}-home`,
        });

        // Create the menu
        const menu = createElement('div', {
            role: 'menu',
        });

        home.appendChild(menu);
        inner.appendChild(home);
        this.elements.settings.panels.home = home;

        // Build the menu items
        this.config.settings.forEach(type => {
            // TODO: bundle this with the createMenuItem helper and bindings
            const menuItem = createElement(
                'button',
                extend(getAttributesFromSelector(this.config.selectors.buttons.settings), {
                    type: 'button',
                    class: `${this.config.classNames.control} ${this.config.classNames.control}--forward`,
                    role: 'menuitem',
                    'aria-haspopup': true,
                    hidden: '',
                }),
            );

            // Bind menu shortcuts for keyboard users
            controls.bindMenuItemShortcuts.call(this, menuItem, type);

            // Show menu on click
            on(menuItem, 'click', () => {
                controls.showMenuPanel.call(this, type, false);
            });

            const flex = createElement('span', null, i18n.get(type, this.config));

            const value = createElement('span', {
                class: this.config.classNames.menu.value,
            });

            // Speed contains HTML entities
            value.innerHTML = data[type];

            flex.appendChild(value);
            menuItem.appendChild(flex);
            menu.appendChild(menuItem);

            // Build the panes
            const pane = createElement('div', {
                id: `plyr-settings-${data.id}-${type}`,
                hidden: '',
            });

            // Back button
            const backButton = createElement('button', {
                type: 'button',
                class: `${this.config.classNames.control} ${this.config.classNames.control}--back`,
            });

            // Visible label
            backButton.appendChild(
                createElement(
                    'span',
                    {
                        'aria-hidden': true,
                    },
                    i18n.get(type, this.config),
                ),
            );

            // Screen reader label
            backButton.appendChild(
                createElement(
                    'span',
                    {
                        class: this.config.classNames.hidden,
                    },
                    i18n.get('menuBack', this.config),
                ),
            );

            // Go back via keyboard
            on(
                pane,
                'keydown',
                event => {
                    // We only care about <-
                    if (event.which !== 37) {
                        return;
                    }

                    // Prevent seek
                    event.preventDefault();
                    event.stopPropagation();

                    // Show the respective menu
                    controls.showMenuPanel.call(this, 'home', true);
                },
                false,
            );

            // Go back via button click
            on(backButton, 'click', () => {
                controls.showMenuPanel.call(this, 'home', false);
            });

            // Add to pane
            pane.appendChild(backButton);

            // Menu
            pane.appendChild(
                createElement('div', {
                    role: 'menu',
                }),
            );

            inner.appendChild(pane);

            this.elements.settings.buttons[type] = menuItem;
            this.elements.settings.panels[type] = pane;
        });

        popup.appendChild(inner);
        wrapper.appendChild(popup);

        this.elements.settings.popup = popup;
        this.elements.settings.menu = wrapper;

        return wrapper;
    }

};

export default settings;