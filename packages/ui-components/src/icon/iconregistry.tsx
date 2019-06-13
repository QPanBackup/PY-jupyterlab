// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import { classes } from 'typestyle/lib';

import { Icon } from './icon';
import { camelize } from '../utils';
import { IIconStyle, iconStyle, iconStyleFlat } from '../style/icon';

import badSvg from '../../style/icons/bad.svg';

/**
 * The icon registry class.
 */
export class IconRegistry {
  constructor(options?: IconRegistry.IOptions) {
    this._debug = !!options.debug;

    let icons = options.initialIcons || Icon.defaultIcons;
    this.addIcon(...icons);

    // add the bad state icon
    this.addIcon({ name: 'bad', svg: badSvg });
  }

  addIcon(...icons: Icon.IModel[]): void {
    icons.forEach((icon: Icon.IModel) => {
      let className = icon.className
        ? icon.className
        : IconRegistry.iconClassName(icon.name);
      this._classNameToName[className] = icon.name;
      this._nameToClassName[icon.name] = className;
      this._svg[icon.name] = icon.svg;
    });
  }

  /**
   * Get the icon as an HTMLElement of tag <svg><svg/>
   */
  icon(
    props: IconRegistry.IIconOptions & { container: HTMLElement } & IIconStyle
  ): HTMLElement {
    const { name, className, title, container, ...propsStyle } = props;

    // if name not in _svg, assume we've been handed a className in place of name
    let svg = this.resolveSvg(name);
    if (!svg) {
      // bail
      return;
    }

    let svgNode = Private.parseSvg(svg);

    if (title) {
      Private.setTitleSvg(svgNode, title);
    }

    if (container) {
      // clear any existing icon in container (and all other child elements)
      container.textContent = '';
      container.appendChild(svgNode);

      let styleClass = propsStyle ? iconStyle(propsStyle) : '';
      if (className || className === '') {
        // override the className, if explicitly passed
        container.className = classes(className, styleClass);
      } else if (!(styleClass in container.classList)) {
        // add icon styling class to the container's class, if not already present
        container.className = classes(container.className, styleClass);
      }
    } else {
      // add icon styling class directly to the svg node
      svgNode.setAttribute(
        'class',
        classes(className, propsStyle ? iconStyleFlat(propsStyle) : '')
      );
    }

    return svgNode;
  }

  /**
   * Get the icon as a ReactElement of tag <tag><svg><svg/><tag/>
   * TODO: figure out how to remove the unnecessary outer <tag>
   */
  iconReact(
    props: IconRegistry.IIconOptions & { tag?: 'div' | 'span' } & IIconStyle
  ): React.ReactElement {
    const { name, className, title, tag, ...propsStyle } = props;
    const Tag = tag || 'div';

    let svg = this.resolveSvg(name);
    if (!svg) {
      // bail
      return;
    }

    return (
      <Tag
        className={classes(className, propsStyle ? iconStyle(propsStyle) : '')}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  resolveName(name: string): string {
    if (!(name in this._svg)) {
      // assume name is really a className, split the className into parts and check each part
      for (let className of name.split(/\s+/)) {
        if (className in this._classNameToName) {
          return this._classNameToName[className];
        }
      }
      // couldn't resolve name, mark as bad
      return 'bad';
    }

    return name;
  }

  resolveSvg(name: string): string {
    let svgname = this.resolveName(name);

    if (svgname === 'bad') {
      if (this._debug) {
        // log a warning and mark missing icons with an X
        console.error(`Invalid icon name: ${name}`);
      } else {
        // silently return empty string
        return '';
      }
    }

    return this._svg[svgname];
  }

  get svg() {
    return this._svg;
  }

  static iconClassName(name: string): string {
    return 'jp-' + camelize(name, true) + 'Icon';
  }

  private _classNameToName: { [key: string]: string } = Object.create(null);
  private _debug: boolean = false;
  private _nameToClassName: { [key: string]: string } = Object.create(null);
  private _svg: { [key: string]: string } = Object.create(null);
}

/**
 * The defaultIconRegistry instance.
 */
export const defaultIconRegistry: IconRegistry = new IconRegistry();

/**
 * Alias for defaultIconRegistry.iconReact that can be used as a React component
 */
export const IconReact = (
  props: IconRegistry.IIconOptions & { tag?: 'div' | 'span' } & IIconStyle
): React.ReactElement => {
  return defaultIconRegistry.iconReact(props);
};

export namespace IconRegistry {
  /**
   * The options used to create an icon registry.
   */
  export interface IOptions {
    /**
     * The initial icons for the registry.
     * The [[Icon.defaultIcons]] will be used if not given.
     */
    initialIcons?: Icon.IModel[];

    /**
     * If the debug flag is set, missing icons will raise a warning
     * and be visually marked with an "X". Otherwise, missing icons
     * will fail silently.
     */
    debug?: boolean;
  }

  /**
   * The options used to set an icon
   */
  export interface IIconOptions {
    name: string;
    className?: string;
    title?: string;
  }
}

namespace Private {
  export function parseSvg(svg: string): HTMLElement {
    let parser = new DOMParser();
    return parser.parseFromString(svg, 'image/svg+xml').documentElement;
  }

  export function setTitleSvg(svgNode: HTMLElement, title: string): void {
    // add a title node to the top level svg node
    let titleNodes = svgNode.getElementsByTagName('title');
    if (titleNodes) {
      titleNodes[0].textContent = title;
    } else {
      let titleNode = document.createElement('title');
      titleNode.textContent = title;
      svgNode.appendChild(titleNode);
    }
  }
}
