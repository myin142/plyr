/* eslint-disable class-methods-use-this */
import captions from '../captions';
import controls from '../controls';
import support from '../support';
import { transitionEndEvent } from '../utils/animation';
import { dedupe } from '../utils/arrays';
import {
    createElement,
    emptyElement,
    getAttributesFromSelector,
    matches,
    removeElement,
    setFocus,
    toggleHidden,
} from '../utils/elements';
import { off,on } from '../utils/events';
import i18n from '../utils/i18n';
import is from '../utils/is';
import { extend } from '../utils/objects';

class Settings {

    // Missing
    // this.listeners
    // this.options
    // this.captions
    constructor(config, elements, data, defaultAttributes) {

        // These should be handled differently
        // But for compability for other functions
        // Keeping it here
        this.config = config;
        this.elements = elements;

        this.wrapper = this.createSettingsMenu(data, defaultAttributes);
    }

    createWrapperElement(defaultAttributes) {
        return createElement('div', extend({}, defaultAttributes, {
            class: `${defaultAttributes.class} plyr__menu`.trim(),
            hidden: '',
        }));
    }

    createSettingButton({ id }) {
        return controls.createButton.call(this, 'settings', {
            'aria-haspopup': true,
            'aria-controls': `plyr-settings-${id}`,
            'aria-expanded': false,
        });
    }

    createPopupElement({ id }) {
        return createElement('div', {
            class: 'plyr__menu__container',
            id: `plyr-settings-${id}`,
            hidden: '',
        });
    }

    createSettingsMenu(data, defaultAttributes) {
        const wrapper = this.createWrapperElement(defaultAttributes);
        wrapper.appendChild(this.createSettingButton(data));

        const popup = this.createPopupElement(data);
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
            this.bindMenuItemShortcuts(menuItem, type);

            // Show menu on click
            on(menuItem, 'click', () => {
                this.showMenuPanel(type, false);
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
                    this.showMenuPanel('home', true);
                },
                false,
            );

            // Go back via button click
            on(backButton, 'click', () => {
                this.showMenuPanel('home', false);
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

    createMenuItem({ value, list, type, title, badge = null, checked = false }) {
        const attributes = getAttributesFromSelector(this.config.selectors.inputs[type]);

        const menuItem = createElement(
            'button',
            extend(attributes, {
                type: 'button',
                role: 'menuitemradio',
                class: `${this.config.classNames.control} ${attributes.class ? attributes.class : ''}`.trim(),
                'aria-checked': checked,
                value,
            }),
        );

        const flex = createElement('span');

        // We have to set as HTML incase of special characters
        flex.innerHTML = title;

        if (is.element(badge)) {
            flex.appendChild(badge);
        }

        menuItem.appendChild(flex);

        // Replicate radio button behaviour
        Object.defineProperty(menuItem, 'checked', {
            enumerable: true,
            get() {
                return menuItem.getAttribute('aria-checked') === 'true';
            },
            set(check) {
                // Ensure exclusivity
                if (check) {
                    Array.from(menuItem.parentNode.children)
                        .filter(node => matches(node, '[role="menuitemradio"]'))
                        .forEach(node => node.setAttribute('aria-checked', 'false'));
                }

                menuItem.setAttribute('aria-checked', check ? 'true' : 'false');
            },
        });

        this.listeners.bind(
            menuItem,
            'click keyup',
            event => {
                if (is.keyboardEvent(event) && event.which !== 32) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                menuItem.checked = true;

                switch (type) {
                    case 'language':
                        this.currentTrack = Number(value);
                        break;

                    case 'quality':
                        this.quality = value;
                        break;

                    case 'speed':
                        this.speed = parseFloat(value);
                        break;

                    default:
                        break;
                }

                this.showMenuPanel('home', is.keyboardEvent(event));
            },
            type,
            false,
        );

        this.bindMenuItemShortcuts(menuItem, type);

        list.appendChild(menuItem);
    }

    setSpeedMenu(options) {
        // Menu required
        if (!is.element(this.elements.settings.panels.speed)) {
            return;
        }

        const type = 'speed';
        const list = this.elements.settings.panels.speed.querySelector('[role="menu"]');

        // Set the speed options
        if (is.array(options)) {
            this.options.speed = options;
        } else if (this.isHTML5 || this.isVimeo) {
            this.options.speed = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        }

        // Set options if passed and filter based on config
        this.options.speed = this.options.speed.filter(speed => this.config.speed.options.includes(speed));

        // Toggle the pane and tab
        const toggle = !is.empty(this.options.speed) && this.options.speed.length > 1;
        controls.toggleMenuButton.call(this, type, toggle);

        // Empty the menu
        emptyElement(list);

        // Check if we need to toggle the parent
        this.checkMenu();

        // If we're hiding, nothing more to do
        if (!toggle) {
            return;
        }

        // Create items
        this.options.speed.forEach(speed => {
            this.createMenuItem({
                value: speed,
                list,
                type,
                title: controls.getLabel.call(this, 'speed', speed),
            });
        });

        controls.updateSetting.call(this, type, list);
    }

    setQualityMenu(options) {
        // Menu required
        if (!is.element(this.elements.settings.panels.quality)) {
            return;
        }

        const type = 'quality';
        const list = this.elements.settings.panels.quality.querySelector('[role="menu"]');

        // Set options if passed and filter based on uniqueness and config
        if (is.array(options)) {
            this.options.quality = dedupe(options).filter(quality => this.config.quality.options.includes(quality));
        }

        // Toggle the pane and tab
        const toggle = !is.empty(this.options.quality) && this.options.quality.length > 1;
        controls.toggleMenuButton.call(this, type, toggle);

        // Empty the menu
        emptyElement(list);

        // Check if we need to toggle the parent
        this.checkMenu();

        // If we're hiding, nothing more to do
        if (!toggle) {
            return;
        }

        // Get the badge HTML for HD, 4K etc
        const getBadge = quality => {
            const label = i18n.get(`qualityBadge.${quality}`, this.config);

            if (!label.length) {
                return null;
            }

            return controls.createBadge.call(this, label);
        };

        // Sort options by the config and then render options
        this.options.quality
            .sort((a, b) => {
                const sorting = this.config.quality.options;
                return sorting.indexOf(a) > sorting.indexOf(b) ? 1 : -1;
            })
            .forEach(quality => {
                this.createMenuItem({
                    value: quality,
                    list,
                    type,
                    title: controls.getLabel.call(this, 'quality', quality),
                    badge: getBadge(quality),
                });
            });

        controls.updateSetting.call(this, type, list);
    }

    // Get current selected caption language
    // TODO: rework this to user the getter in the API?

    // Set a list of available captions languages
    setCaptionsMenu() {
        // Menu required
        if (!is.element(this.elements.settings.panels.captions)) {
            return;
        }

        // TODO: Captions or language? Currently it's mixed
        const type = 'captions';
        const list = this.elements.settings.panels.captions.querySelector('[role="menu"]');
        const tracks = captions.getTracks.call(this);
        const toggle = Boolean(tracks.length);

        // Toggle the pane and tab
        controls.toggleMenuButton.call(this, type, toggle);

        // Empty the menu
        emptyElement(list);

        // Check if we need to toggle the parent
        this.checkMenu();

        // If there's no captions, bail
        if (!toggle) {
            return;
        }

        // Generate options data
        const options = tracks.map((track, value) => ({
            value,
            checked: this.captions.toggled && this.currentTrack === value,
            title: captions.getLabel.call(this, track),
            badge: track.language && controls.createBadge.call(this, track.language.toUpperCase()),
            list,
            type: 'language',
        }));

        // Add the "Disabled" option to turn off captions
        options.unshift({
            value: -1,
            checked: !this.captions.toggled,
            title: i18n.get('disabled', this.config),
            list,
            type: 'language',
        });

        // Generate options
        options.forEach(controls.createMenuItem.bind(this));

        controls.updateSetting.call(this, type, list);
    }

    // Bind keyboard shortcuts for a menu item
    // We have to bind to keyup otherwise Firefox triggers a click when a keydown event handler shifts focus
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1220143
    bindMenuItemShortcuts(menuItem, type) {
        // Navigate through menus via arrow keys and space
        on(
            menuItem,
            'keydown keyup',
            event => {
                // We only care about space and ⬆️ ⬇️️ ➡️
                if (![32, 38, 39, 40].includes(event.which)) {
                    return;
                }

                // Prevent play / seek
                event.preventDefault();
                event.stopPropagation();

                // We're just here to prevent the keydown bubbling
                if (event.type === 'keydown') {
                    return;
                }

                const isRadioButton = matches(menuItem, '[role="menuitemradio"]');

                // Show the respective menu
                if (!isRadioButton && [32, 39].includes(event.which)) {
                    this.showMenuPanel(type, true);
                } else {
                    let target;

                    if (event.which !== 32) {
                        if (event.which === 40 || (isRadioButton && event.which === 39)) {
                            target = menuItem.nextElementSibling;

                            if (!is.element(target)) {
                                target = menuItem.parentNode.firstElementChild;
                            }
                        } else {
                            target = menuItem.previousElementSibling;

                            if (!is.element(target)) {
                                target = menuItem.parentNode.lastElementChild;
                            }
                        }

                        setFocus.call(this, target, true);
                    }
                }
            },
            false,
        );

        // Enter will fire a `click` event but we still need to manage focus
        // So we bind to keyup which fires after and set focus here
        on(menuItem, 'keyup', event => {
            if (event.which !== 13) {
                return;
            }

            controls.focusFirstMenuItem.call(this, null, true);
        });
    }

    // Show a panel in the menu
    showMenuPanel(type = '', tabFocus = false) {
        const target = this.elements.container.querySelector(`#plyr-settings-${this.id}-${type}`);

        // Nothing to show, bail
        if (!is.element(target)) {
            return;
        }

        // Hide all other panels
        const container = target.parentNode;
        const current = Array.from(container.children).find(node => !node.hidden);

        // If we can do fancy animations, we'll animate the height/width
        if (support.transitions && !support.reducedMotion) {
            // Set the current width as a base
            container.style.width = `${current.scrollWidth}px`;
            container.style.height = `${current.scrollHeight}px`;

            // Get potential sizes
            const size = this.getMenuSize(target);

            // Restore auto height/width
            const restore = event => {
                // We're only bothered about height and width on the container
                if (event.target !== container || !['width', 'height'].includes(event.propertyName)) {
                    return;
                }

                // Revert back to auto
                container.style.width = '';
                container.style.height = '';

                // Only listen once
                off.call(this, container, transitionEndEvent, restore);
            };

            // Listen for the transition finishing and restore auto height/width
            on.call(this, container, transitionEndEvent, restore);

            // Set dimensions to target
            container.style.width = `${size.width}px`;
            container.style.height = `${size.height}px`;
        }

        // Set attributes on current tab
        toggleHidden(current, true);

        // Set attributes on target
        toggleHidden(target, false);

        // Focus the first item
        controls.focusFirstMenuItem.call(this, target, tabFocus);
    }

    // Get the natural size of a menu panel
    getMenuSize(tab) {
        const clone = tab.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.opacity = 0;
        clone.removeAttribute('hidden');

        // Append to parent so we get the "real" size
        tab.parentNode.appendChild(clone);

        // Get the sizes before we remove
        const width = clone.scrollWidth;
        const height = clone.scrollHeight;

        // Remove from the DOM
        removeElement(clone);

        return {
            width,
            height,
        };
    }


    // Check if we need to hide/show the settings menu
    checkMenu() {
        const { buttons } = this.elements.settings;
        const visible = !is.empty(buttons) && Object.values(buttons).some(button => !button.hidden);

        toggleHidden(this.elements.settings.menu, !visible);
    }

}

export default Settings;