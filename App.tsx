import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Settings, Upload } from 'lucide-react';

type SandboxElement =
  | string
  | number
  | boolean
  | null
  | undefined
  | SandboxReactElement
  | SandboxElement[];

type SandboxReactElement = {
  type: any;
  props: Record<string, any> & { children?: SandboxElement };
};

const SandboxReact = (() => {
  const Fragment = Symbol.for('SandboxReact.Fragment');

  const createElement = (type: any, props: any, ...children: any[]): SandboxReactElement => {
    const nextProps = { ...(props || {}) };
    if (children.length === 1) nextProps.children = children[0];
    else if (children.length > 1) nextProps.children = children;
    return { type, props: nextProps };
  };

  const useState = (initialValue: any) => [typeof initialValue === 'function' ? initialValue() : initialValue, () => {}] as const;
  const useEffect = () => {};
  const useLayoutEffect = () => {};
  const useMemo = (factory: any) => (typeof factory === 'function' ? factory() : factory);
  const useCallback = (callback: any) => callback;
  const useRef = (initialValue: any) => ({ current: initialValue });

  return { createElement, Fragment, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef };
})();

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const camelToKebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const styleObjectToCssText = (style: any): string => {
  if (!style || typeof style !== 'object') return '';
  
  // Handle arrays (for fallback values)
  if (Array.isArray(style)) {
    style = style[style.length - 1];
    if (!style || typeof style !== 'object') return '';
  }
  
  const entries = Object.entries(style)
    .filter(([k, v]) => {
      // Filter out functions, undefined, null, and complex objects
      if (!k || v === undefined || v === null) return false;
      if (typeof v === 'function') return false;
      if (typeof v === 'object' && !Array.isArray(v)) return false;
      return true;
    })
    .map(([k, v]) => {
      const cssKey = camelToKebab(k);
      let cssVal: string;
      
      if (typeof v === 'number') {
        // Don't add px to unitless properties
        const unitlessProps = ['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'order', 'flex', 'flexGrow', 'flexShrink', 'zIndex'];
        cssVal = unitlessProps.includes(k) ? String(v) : `${v}px`;
      } else if (typeof v === 'string') {
        // If string already has a unit (px, %, em, rem, etc), use as-is
        cssVal = v;
      } else if (Array.isArray(v)) {
        cssVal = v.join(', ');
      } else {
        cssVal = String(v);
      }
      
      return `${cssKey}: ${cssVal}`;
    });
  return entries.join('; ');
};

const extractImportStubs = (source: string) => {
  const stubs: string[] = [];
  const skipped = new Set(['Fragment', 'useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef']);
  const importRegex = /^\s*import\s+([\s\S]+?)\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm;

  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(source))) {
    const clause = m[1].trim();

    if (clause.startsWith('React')) continue;

    // import Default, { A as B } ...
    const parts = clause.split(',');
    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;

      if (part.startsWith('{') && part.endsWith('}')) {
        const inner = part.slice(1, -1).trim();
        if (!inner) continue;
        inner.split(',').forEach((named) => {
          const t = named.trim();
          if (!t) return;
          const [original, alias] = t.split(/\s+as\s+/);
          const originalName = original.trim();
          const name = (alias || originalName).trim();
          if (skipped.has(originalName) || skipped.has(name)) return;
          if (name) {
            stubs.push(name);
          }
        });
      } else if (part.startsWith('* as ')) {
        const name = part.replace('* as ', '').trim();
        if (name) stubs.push(name);
      } else {
        // default import
        const name = part;
        if (name && name !== 'React') stubs.push(name);
      }
    }
  }

  const unique = Array.from(new Set(stubs));
  const stubLines = unique.map((name) => {
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
      return `const ${name} = new Proxy(function ${name}Proxy(){}, { get: () => (props) => React.createElement(\"div\", { \"data-import\": \"${name}\" }, props && props.children) });`;
    }
    return '';
  }).filter(Boolean);

  return stubLines.join('\n');
};

const preprocessJsxModule = (source: string) => {
  const exportDefaultMatch = source.match(/export\s+default\s+([A-Za-z0-9_$]+)\s*;?/);
  const exportDefaultName = exportDefaultMatch?.[1] || null;

  const withoutImports = source.replace(/^\s*import\s+[\s\S]*?;?\s*$/gm, '');
  const withoutExports = withoutImports.replace(/^\s*export\s+default\s+[\s\S]*?;?\s*$/gm, '');

  return { exportDefaultName, body: withoutExports };
};

const resolveSandboxElement = (node: SandboxElement): SandboxElement => {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return node;

  if (Array.isArray(node)) {
    const flat: any[] = [];
    node.forEach((c) => {
      const r = resolveSandboxElement(c as any);
      if (Array.isArray(r)) flat.push(...r);
      else if (r !== null && r !== undefined && r !== false) flat.push(r);
    });
    return flat;
  }

  const el = node as SandboxReactElement;
  if (!el || typeof el !== 'object') return null;

  const t = el.type;

  if (t === SandboxReact.Fragment) {
    return resolveSandboxElement(el.props?.children);
  }

  if (typeof t === 'function') {
    const props = el.props || {};
    const rendered = t(props);
    return resolveSandboxElement(rendered as any);
  }

  const resolvedChildren = resolveSandboxElement(el.props?.children);
  return {
    type: t,
    props: {
      ...(el.props || {}),
      children: resolvedChildren,
    },
  } as SandboxReactElement;
};

const elementToHtml = (node: SandboxElement): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'number') return escapeHtml(String(node));
  if (typeof node === 'string') return escapeHtml(node);

  if (Array.isArray(node)) return node.map(elementToHtml).join('');

  const el = node as SandboxReactElement;
  if (!el || typeof el !== 'object') return '';

  const tag = typeof el.type === 'string' ? el.type : 'div';
  const props = el.props || {};

  if (tag === 'style') {
    const raw = props.dangerouslySetInnerHTML?.__html ??
      (Array.isArray(props.children) ? props.children.join('') : props.children);
    const cssText = raw === undefined || raw === null ? '' : String(raw);
    return `<style>${cssText}</style>`;
  }

  const attrs: string[] = [];

  // Normalize className
  if (props.className) attrs.push(`class=\"${escapeHtml(String(props.className))}\"`);

  // Inline styles - handle both objects and merged styles (spread operator results)
  if (props.style) {
    // If style is an array (from spread operator merging), use the last one (rightmost wins)
    const styleObj = Array.isArray(props.style) ? props.style[props.style.length - 1] : props.style;
    const cssText = styleObjectToCssText(styleObj);
    if (cssText) attrs.push(`style=\"${escapeHtml(cssText)}\"`);
  }

  // Basic attributes
  const passthroughAttrs = ['id', 'src', 'alt', 'href', 'title', 'value', 'type', 'placeholder'];
  passthroughAttrs.forEach((a) => {
    if (props[a] !== undefined && props[a] !== null) {
      attrs.push(`${a}=\"${escapeHtml(String(props[a]))}\"`);
    }
  });

  // Handle dangerouslySetInnerHTML
  if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
    return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${props.dangerouslySetInnerHTML.__html}</${tag}>`;
  }

  const children = elementToHtml(props.children);

  return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${children}</${tag}>`;
};

const jsxFileToHtml = (source: string, babel: any) => {
  if (!babel || typeof babel.transform !== 'function') {
    throw new Error('Babel is not available');
  }
  const { exportDefaultName, body } = preprocessJsxModule(source);
  if (!exportDefaultName) {
    throw new Error('No export default found. Add: export default YourComponent;');
  }

  const importStubs = extractImportStubs(source);

  const babelResult = babel.transform(
    `${importStubs}\n${body}\n`,
    {
      presets: [['react', { runtime: 'classic' }]],
      plugins: [
        'proposal-object-rest-spread',
        'proposal-optional-chaining',
        'proposal-nullish-coalescing-operator',
      ],
      filename: 'input.jsx',
    }
  );

  const compiled = babelResult.code || '';
  
  // Create a more complete JavaScript environment
  const wrapper = `
    "use strict";
    const React = arguments[0];
    const useState = arguments[1];
    const useEffect = arguments[2];
    const useLayoutEffect = arguments[3];
    const useMemo = arguments[4];
    const useCallback = arguments[5];
    const useRef = arguments[6];
    
    ${compiled}
    return ${exportDefaultName};
  `;

  const factory = new Function(wrapper) as any;
  const Component = factory(
    SandboxReact, 
    SandboxReact.useState, 
    SandboxReact.useEffect,
    SandboxReact.useLayoutEffect,
    SandboxReact.useMemo,
    SandboxReact.useCallback,
    SandboxReact.useRef
  );

  if (typeof Component !== 'function') {
    throw new Error('export default did not resolve to a React component function');
  }

  const root = Component({});
  const resolved = resolveSandboxElement(root as any);
  return elementToHtml(resolved as any);
};

type CssRule = {
  selector: string;
  declarations: Record<string, string>;
  specificity: number;
  order: number;
};

type ParsedColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

type RobloxSize = {
  scale: number;
  offset: number;
  auto: boolean;
};

type GradientStop = {
  color: ParsedColor;
  position: number;
};

type BackgroundGradient = {
  kind: 'linear';
  angle: number | null;
  stops: GradientStop[];
  raw: string;
};

type RobloxFlexLayout = {
  kind: 'flex';
  direction: 'Vertical' | 'Horizontal';
  gapX: number;
  gapY: number;
  justify: 'Start' | 'Center' | 'End';
  align: 'Start' | 'Center' | 'End';
  alignRaw: string;
  justifyRaw: string;
};

type RobloxGridLayout = {
  kind: 'grid';
  columns: number;
  gapX: number;
  gapY: number;
  template: string | null;
};

type RobloxLayout = RobloxFlexLayout | RobloxGridLayout;

type RobloxBorder = {
  thickness: number;
  color: ParsedColor;
};

type RobloxNode = {
  name: string;
  kind: 'Frame' | 'TextLabel' | 'TextButton' | 'ImageLabel';
  tagName: string;
  text: string;
  styles: Record<string, string>;
  children: RobloxNode[];
  size: { x: RobloxSize; y: RobloxSize };
  automaticSize: 'X' | 'Y' | 'XY' | null;
  padding: { top: number; right: number; bottom: number; left: number } | null;
  margin: { top: number; right: number; bottom: number; left: number } | null;
  layout: RobloxLayout | null;
  flexItem: boolean;
  backgroundColor: ParsedColor | null;
  backgroundGradient: BackgroundGradient | null;
  textColor: ParsedColor | null;
  borderRadius: number | null;
  fontSize: number | null;
  fontWeight: number | null;
  textAlign: 'left' | 'center' | 'right';
  clipsDescendants: boolean;
  opacity: number | null;
  imageSrc: string | null;
  border: RobloxBorder | null;
};

type ConversionOptions = {
  useScale: boolean;
};

const DEFAULT_DISPLAY_BY_TAG: Record<string, string> = {
  div: 'block',
  p: 'block',
  h1: 'block',
  h2: 'block',
  h3: 'block',
  h4: 'block',
  h5: 'block',
  h6: 'block',
  header: 'block',
  section: 'block',
  article: 'block',
  main: 'block',
  nav: 'block',
  footer: 'block',
  ul: 'block',
  ol: 'block',
  li: 'block',
  form: 'block',
  img: 'inline-block',
  span: 'inline',
  a: 'inline',
  button: 'inline-block',
  label: 'inline',
};

const stripCssComments = (cssText: string) => cssText.replace(/\/\*[\s\S]*?\*\//g, '');

const parseDeclarations = (body: string) => {
  const decls: Record<string, string> = {};
  body.split(';').forEach((part) => {
    const [prop, ...rest] = part.split(':');
    if (!prop || rest.length === 0) return;
    const value = rest.join(':').trim();
    if (!value) return;
    const cleanedValue = value.replace(/\s*!important\s*$/, '');
    decls[prop.trim().toLowerCase()] = cleanedValue;
  });
  return decls;
};

const computeSpecificity = (selector: string) => {
  const idCount = (selector.match(/#[A-Za-z0-9_-]+/g) || []).length;
  const classCount = (selector.match(/\.[A-Za-z0-9_-]+/g) || []).length;
  const tagMatch = selector.trim().match(/^[A-Za-z][A-Za-z0-9-]*/);
  const tagCount = tagMatch ? 1 : 0;
  return idCount * 100 + classCount * 10 + tagCount;
};

const isSimpleSelector = (selector: string) => {
  if (!selector) return false;
  if (/[\s>+~]/.test(selector)) return false;
  if (selector.includes('[') || selector.includes(':')) return false;
  return true;
};

const matchSimpleSelector = (element: Element, selector: string) => {
  const trimmed = selector.trim();
  if (!trimmed) return false;
  if (trimmed === '*') return true;
  if (!isSimpleSelector(trimmed)) return false;

  const tagMatch = trimmed.match(/^[A-Za-z][A-Za-z0-9-]*/);
  if (tagMatch && tagMatch[0].toLowerCase() !== element.tagName.toLowerCase()) {
    return false;
  }

  const idMatches = trimmed.match(/#[A-Za-z0-9_-]+/g) || [];
  if (idMatches.length) {
    const id = element.getAttribute('id') || '';
    if (!idMatches.every((m) => id === m.slice(1))) return false;
  }

  const classMatches = trimmed.match(/\.[A-Za-z0-9_-]+/g) || [];
  if (classMatches.length) {
    const classList = (element.getAttribute('class') || '').split(/\s+/).filter(Boolean);
    if (!classMatches.every((m) => classList.includes(m.slice(1)))) return false;
  }

  return true;
};

const parseCssRules = (cssText: string): CssRule[] => {
  const cleaned = stripCssComments(cssText);
  const rules: CssRule[] = [];
  const blockRegex = /([^{}]+)\{([^{}]+)\}/g;
  let order = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned))) {
    const rawSelector = match[1].trim();
    const body = match[2].trim();
    if (!rawSelector || rawSelector.startsWith('@')) continue;

    const declarations = parseDeclarations(body);
    rawSelector.split(',').forEach((rawSel) => {
      const selector = rawSel.trim();
      if (!selector) return;
      rules.push({
        selector,
        declarations,
        specificity: computeSpecificity(selector),
        order: order++,
      });
    });
  }

  return rules;
};

const extractStyleText = (doc: Document) => {
  const styleTags = Array.from(doc.querySelectorAll('style'));
  return styleTags.map((tag) => tag.textContent || '').join('\n');
};

const computeStylesForElement = (element: Element, rules: CssRule[]) => {
  const styles: Record<string, string> = {};
  const matching = rules
    .filter((rule) => matchSimpleSelector(element, rule.selector))
    .sort((a, b) => a.specificity - b.specificity || a.order - b.order);

  matching.forEach((rule) => {
    Object.assign(styles, rule.declarations);
  });

  const inline = parseDeclarations(element.getAttribute('style') || '');
  Object.assign(styles, inline);

  return styles;
};

const parseCssSize = (value?: string) => {
  if (!value) return { kind: 'auto' as const };
  const raw = value.trim().toLowerCase();
  if (!raw || raw === 'auto') return { kind: 'auto' as const };

  if (raw.endsWith('%')) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) return { kind: 'percent' as const, value: num / 100 };
  }

  if (raw.endsWith('px')) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) return { kind: 'px' as const, value: num };
  }

  if (raw.endsWith('rem')) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) return { kind: 'px' as const, value: num * 16 };
  }

  if (raw.endsWith('em')) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) return { kind: 'px' as const, value: num * 16 };
  }

  if (raw.endsWith('vh') || raw.endsWith('vw')) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) return { kind: 'percent' as const, value: num / 100 };
  }

  const num = parseFloat(raw);
  if (!Number.isNaN(num)) return { kind: 'px' as const, value: num };

  return { kind: 'auto' as const };
};

const resolveRobloxSize = (value: string | undefined, useScale: boolean): RobloxSize => {
  const parsed = parseCssSize(value);
  if (parsed.kind === 'auto') return { scale: 0, offset: 0, auto: true };
  if (parsed.kind === 'percent') return { scale: parsed.value, offset: 0, auto: false };

  const px = parsed.value || 0;
  if (useScale) {
    return { scale: px / 1000, offset: 0, auto: false };
  }

  return { scale: 0, offset: Math.round(px), auto: false };
};

const parseNumber = (value?: string) => {
  if (!value) return 0;
  const raw = value.trim().toLowerCase();
  if (raw.endsWith('rem') || raw.endsWith('em') || raw.endsWith('px')) {
    const parsed = parseCssSize(raw);
    if (parsed.kind === 'px') return parsed.value;
    return 0;
  }
  const num = parseFloat(raw);
  return Number.isNaN(num) ? 0 : num;
};

const parseBoxValues = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean).map(parseNumber);
  if (parts.length === 0) return [0, 0, 0, 0];
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return [parts[0], parts[1], parts[2], parts[3]];
};

const getPadding = (styles: Record<string, string>) => {
  let top = 0;
  let right = 0;
  let bottom = 0;
  let left = 0;

  if (styles['padding']) {
    const values = parseBoxValues(styles['padding']);
    [top, right, bottom, left] = values;
  }

  if (styles['padding-top']) top = parseNumber(styles['padding-top']);
  if (styles['padding-right']) right = parseNumber(styles['padding-right']);
  if (styles['padding-bottom']) bottom = parseNumber(styles['padding-bottom']);
  if (styles['padding-left']) left = parseNumber(styles['padding-left']);

  if (top === 0 && right === 0 && bottom === 0 && left === 0) return null;
  return { top, right, bottom, left };
};

const getMargin = (styles: Record<string, string>) => {
  let top = 0;
  let right = 0;
  let bottom = 0;
  let left = 0;

  if (styles['margin']) {
    const values = parseBoxValues(styles['margin']);
    [top, right, bottom, left] = values;
  }

  if (styles['margin-top']) top = parseNumber(styles['margin-top']);
  if (styles['margin-right']) right = parseNumber(styles['margin-right']);
  if (styles['margin-bottom']) bottom = parseNumber(styles['margin-bottom']);
  if (styles['margin-left']) left = parseNumber(styles['margin-left']);

  if (top === 0 && right === 0 && bottom === 0 && left === 0) return null;
  return { top, right, bottom, left };
};

const parseFontWeight = (value?: string) => {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (raw === 'normal') return 400;
  if (raw === 'bold') return 700;
  const num = parseInt(raw, 10);
  return Number.isNaN(num) ? null : num;
};

const parseTextAlign = (value?: string) => {
  if (!value) return 'left' as const;
  const raw = value.trim().toLowerCase();
  if (raw === 'center') return 'center' as const;
  if (raw === 'right' || raw === 'end') return 'right' as const;
  return 'left' as const;
};

const parseOpacity = (value?: string) => {
  if (!value) return null;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(1, num));
};

const TEXT_INHERIT_PROPS = [
  'color',
  'font-size',
  'font-weight',
  'text-align',
  'font-family',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
] as const;

const pickTextStyles = (styles: Record<string, string>) => {
  const picked: Record<string, string> = {};
  TEXT_INHERIT_PROPS.forEach((prop) => {
    if (styles[prop]) picked[prop] = styles[prop];
  });
  return picked;
};

const parseColorChannel = (value: string) => {
  const raw = value.trim();
  if (raw.endsWith('%')) {
    const num = parseFloat(raw);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(255, Math.round(255 * (num / 100))));
  }
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(255, Math.round(num)));
};

const parseCssColor = (value?: string): ParsedColor | null => {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  if (raw.startsWith('#')) {
    const hex = raw.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = parseInt(hex[3] + hex[3], 16) / 255;
      return { r, g, b, a };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  }

  const rgbMatch = raw.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      const r = parseColorChannel(parts[0]);
      const g = parseColorChannel(parts[1]);
      const b = parseColorChannel(parts[2]);
      let a = 1;
      if (parts[3] !== undefined) {
        const alphaRaw = parts[3].trim();
        if (alphaRaw.endsWith('%')) {
          const alphaNum = parseFloat(alphaRaw);
          a = Number.isNaN(alphaNum) ? 1 : alphaNum / 100;
        } else {
          const alphaNum = parseFloat(alphaRaw);
          a = Number.isNaN(alphaNum) ? 1 : alphaNum;
        }
        a = Math.max(0, Math.min(1, a));
      }
      return { r, g, b, a };
    }
  }

  const named: Record<string, ParsedColor> = {
    white: { r: 255, g: 255, b: 255, a: 1 },
    black: { r: 0, g: 0, b: 0, a: 1 },
    red: { r: 255, g: 0, b: 0, a: 1 },
    blue: { r: 0, g: 0, b: 255, a: 1 },
    green: { r: 0, g: 255, b: 0, a: 1 },
    gray: { r: 128, g: 128, b: 128, a: 1 },
    grey: { r: 128, g: 128, b: 128, a: 1 },
  };

  return named[raw] || null;
};

const splitCssArgs = (value: string, delimiter = ',') => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && char === delimiter) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const splitCssTokens = (value: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(char)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const parseGradientAngle = (value: string) => {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (raw.endsWith('deg')) {
    const num = parseFloat(raw);
    return Number.isNaN(num) ? null : num;
  }
  if (raw.startsWith('to ')) {
    const dir = raw.slice(3).trim();
    const hasTop = dir.includes('top');
    const hasBottom = dir.includes('bottom');
    const hasLeft = dir.includes('left');
    const hasRight = dir.includes('right');

    if (hasTop && hasRight) return 45;
    if (hasBottom && hasRight) return 135;
    if (hasBottom && hasLeft) return 225;
    if (hasTop && hasLeft) return 315;
    if (hasRight) return 90;
    if (hasBottom) return 180;
    if (hasLeft) return 270;
    if (hasTop) return 0;
  }
  return null;
};

const parseGradientStop = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(.+?)(?:\s+(-?\d+(?:\.\d+)?%?))?$/);
  if (!match) return null;
  const colorPart = match[1].trim();
  const color = parseCssColor(colorPart);
  if (!color) return null;
  let position: number | null = null;
  if (match[2]) {
    const posRaw = match[2].trim();
    if (posRaw.endsWith('%')) {
      const num = parseFloat(posRaw);
      position = Number.isNaN(num) ? null : Math.max(0, Math.min(1, num / 100));
    } else {
      const num = parseFloat(posRaw);
      if (!Number.isNaN(num)) {
        position = num > 1 ? Math.max(0, Math.min(1, num / 100)) : Math.max(0, Math.min(1, num));
      }
    }
  }
  return { color, position };
};

const parseLinearGradient = (value?: string): BackgroundGradient | null => {
  if (!value) return null;
  const match = value.match(/linear-gradient\((.*)\)/i);
  if (!match) return null;
  const inner = match[1];
  const parts = splitCssArgs(inner, ',');
  if (parts.length < 2) return null;

  let angle: number | null = null;
  let startIndex = 0;
  const maybeAngle = parseGradientAngle(parts[0]);
  if (maybeAngle !== null) {
    angle = maybeAngle;
    startIndex = 1;
  }

  const stopsRaw = parts.slice(startIndex)
    .map(parseGradientStop)
    .filter((stop): stop is { color: ParsedColor; position: number | null } => Boolean(stop));

  if (stopsRaw.length === 0) return null;

  const hasPositions = stopsRaw.some((stop) => stop.position !== null);
  const stops: GradientStop[] = stopsRaw.map((stop, index) => {
    let position = stop.position;
    if (position === null) {
      if (stopsRaw.length === 1) position = 0;
      else position = index / (stopsRaw.length - 1);
    }
    return { color: stop.color, position };
  });

  if (hasPositions) {
    stops.sort((a, b) => a.position - b.position);
  }

  return {
    kind: 'linear',
    angle,
    stops,
    raw: `linear-gradient(${inner})`,
  };
};

const parseGapValue = (value: string) => {
  const parts = splitCssTokens(value).map(parseNumber).filter((num) => !Number.isNaN(num));
  if (parts.length === 0) return { row: 0, column: 0 };
  if (parts.length === 1) return { row: parts[0], column: parts[0] };
  return { row: parts[0], column: parts[1] };
};

const getGap = (styles: Record<string, string>) => {
  let row = 0;
  let column = 0;

  if (styles['gap']) {
    const values = parseGapValue(styles['gap']);
    row = values.row;
    column = values.column;
  }

  if (styles['row-gap']) row = parseNumber(styles['row-gap']);
  if (styles['column-gap']) column = parseNumber(styles['column-gap']);

  return { row, column };
};

const parseGridTemplateColumns = (value?: string) => {
  if (!value) return 1;
  const raw = value.trim();
  if (!raw) return 1;
  const repeatMatch = raw.match(/repeat\((\d+)\s*,/i);
  if (repeatMatch) {
    const count = parseInt(repeatMatch[1], 10);
    return Number.isNaN(count) ? 1 : Math.max(1, count);
  }
  const tokens = splitCssTokens(raw).filter((token) => token && token !== '/');
  return Math.max(1, tokens.length);
};

const colorToLua = (color: ParsedColor) =>
  `Color3.fromRGB(${color.r}, ${color.g}, ${color.b})`;

const colorToCss = (color: ParsedColor) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

const parseBorder = (styles: Record<string, string>) => {
  const border = styles['border'];
  const borderStyle = styles['border-style'];
  if (borderStyle && borderStyle.toLowerCase() === 'none') return null;
  if (border && border.toLowerCase() === 'none') return null;

  let thickness = 0;
  let color: ParsedColor | null = null;

  if (border) {
    const lengthMatch = border.match(/(\d+(\.\d+)?)px/);
    if (lengthMatch) thickness = parseFloat(lengthMatch[1]);

    const colorMatches = border.match(/#(?:[0-9a-f]{3,8})|rgba?\([^)]+\)|\b[a-z]+\b/gi) || [];
    for (const token of colorMatches) {
      const parsed = parseCssColor(token);
      if (parsed) {
        color = parsed;
        break;
      }
    }
  }

  if (styles['border-width']) {
    thickness = parseNumber(styles['border-width']);
  }

  if (styles['border-color']) {
    color = parseCssColor(styles['border-color']);
  }

  if (!thickness || !color) return null;
  return { thickness, color };
};

const normalizeDisplay = (displayValue: string | undefined, tagName: string) => {
  const fallback = DEFAULT_DISPLAY_BY_TAG[tagName] || 'block';
  const raw = (displayValue || fallback).trim().toLowerCase();

  if (raw === 'none') return { display: 'none', isInline: false };
  if (raw === 'inline-flex') return { display: 'flex', isInline: true };
  if (raw === 'flex') return { display: 'flex', isInline: false };
  if (raw === 'inline-block') return { display: 'inline-block', isInline: true };
  if (raw === 'inline') return { display: 'inline', isInline: true };
  if (raw === 'block') return { display: 'block', isInline: false };
  return { display: raw, isInline: raw.startsWith('inline') };
};

const getDirectText = (element: Element) => {
  const parts = Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return parts.join(' ');
};

const mapTagToKind = (tagName: string): RobloxNode['kind'] => {
  if (tagName === 'button') return 'TextButton';
  if (tagName === 'img') return 'ImageLabel';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label'].includes(tagName)) {
    return 'TextLabel';
  }
  return 'Frame';
};

const parseFlexAlignment = (value?: string): 'Start' | 'Center' | 'End' => {
  if (!value) return 'Start';
  const raw = value.trim().toLowerCase();
  if (raw === 'center') return 'Center';
  if (raw === 'flex-end' || raw === 'end') return 'End';
  if (raw.startsWith('space-')) return 'Center';
  return 'Start';
};

const buildTextNode = (
  text: string,
  inheritedStyles: Record<string, string>,
  options: ConversionOptions,
  counts: Record<string, number>
): RobloxNode | null => {
  counts.TextLabel = (counts.TextLabel || 0) + 1;
  const name = `TextLabel${counts.TextLabel}`;
  const styles = { ...inheritedStyles };

  const sizeX = resolveRobloxSize(undefined, options.useScale);
  const sizeY = resolveRobloxSize(undefined, options.useScale);

  return {
    name,
    kind: 'TextLabel',
    tagName: '#text',
    text,
    styles,
    children: [],
    size: { x: sizeX, y: sizeY },
    automaticSize: 'XY',
    padding: null,
    margin: null,
    layout: null,
    flexItem: false,
    backgroundColor: null,
    backgroundGradient: null,
    textColor: parseCssColor(styles['color']),
    borderRadius: null,
    fontSize: styles['font-size'] ? parseNumber(styles['font-size']) : null,
    fontWeight: parseFontWeight(styles['font-weight']),
    textAlign: parseTextAlign(styles['text-align']),
    clipsDescendants: false,
    opacity: null,
    imageSrc: null,
    border: null,
  };
};

const buildRobloxNode = (
  element: Element,
  rules: CssRule[],
  options: ConversionOptions,
  counts: Record<string, number>,
  inheritedTextStyles?: Record<string, string>,
  parentLayout?: RobloxLayout | null
): RobloxNode | null => {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'style' || tagName === 'script') return null;

  const ownStyles = computeStylesForElement(element, rules);
  const inherited = inheritedTextStyles ? pickTextStyles(inheritedTextStyles) : {};
  const styles = { ...inherited, ...ownStyles };
  TEXT_INHERIT_PROPS.forEach((prop) => {
    if (styles[prop] === 'inherit') {
      if (inherited[prop]) styles[prop] = inherited[prop];
      else delete styles[prop];
    }
  });
  const displayInfo = normalizeDisplay(styles['display'], tagName);
  if (displayInfo.display === 'none') return null;
  const display = displayInfo.display;

  const gap = getGap(styles);
  let layout: RobloxLayout | null = null;
  if (display === 'flex') {
    const directionRaw = (styles['flex-direction'] || 'row').toLowerCase();
    const alignRaw = (styles['align-items'] || '').trim().toLowerCase();
    const justifyRaw = (styles['justify-content'] || '').trim().toLowerCase();
    layout = {
      kind: 'flex',
      direction: directionRaw.startsWith('column') ? 'Vertical' : 'Horizontal',
      gapX: gap.column,
      gapY: gap.row,
      justify: parseFlexAlignment(styles['justify-content']),
      align: parseFlexAlignment(styles['align-items']),
      alignRaw,
      justifyRaw,
    };
  } else if (display === 'grid') {
    layout = {
      kind: 'grid',
      columns: parseGridTemplateColumns(styles['grid-template-columns']),
      gapX: gap.column,
      gapY: gap.row,
      template: styles['grid-template-columns'] || null,
    };
  }

  const kind = mapTagToKind(tagName);
  counts[kind] = (counts[kind] || 0) + 1;
  const name = `${kind}${counts[kind]}`;

  const directText = kind === 'TextLabel' || kind === 'TextButton' ? getDirectText(element) : '';
  const children: RobloxNode[] = [];

  const childInherited = pickTextStyles(styles);
  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === 3) {
      const text = (child.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (kind === 'TextLabel' || kind === 'TextButton') {
        return;
      }
      const textNode = buildTextNode(text, styles, options, counts);
      if (textNode) children.push(textNode);
      return;
    }
    if (child.nodeType !== 1) return;
    const childElement = child as Element;
    if (childElement.tagName.toLowerCase() === 'style' || childElement.tagName.toLowerCase() === 'script') {
      return;
    }
    const childNode = buildRobloxNode(childElement, rules, options, counts, childInherited, layout);
    if (childNode) children.push(childNode);
  });

  const widthAttr = tagName === 'img' ? element.getAttribute('width') : null;
  const heightAttr = tagName === 'img' ? element.getAttribute('height') : null;
  const widthValue = styles['width'] || styles['min-width'] || (widthAttr ? `${widthAttr}px` : undefined);
  const heightValue = styles['height'] || styles['min-height'] || (heightAttr ? `${heightAttr}px` : undefined);

  let resolvedWidth = widthValue;
  const parentIsGrid = parentLayout?.kind === 'grid';
  const parentFlexStretchX =
    parentLayout?.kind === 'flex' &&
    parentLayout.direction === 'Vertical' &&
    (parentLayout.alignRaw === '' || parentLayout.alignRaw === 'stretch');
  const shouldStretchWidth = parentLayout ? parentFlexStretchX : true;

  if (
    (!resolvedWidth || resolvedWidth.trim() === '' || resolvedWidth.trim().toLowerCase() === 'auto') &&
    (display === 'block' || display === 'flex' || display === 'grid') &&
    !displayInfo.isInline &&
    !parentIsGrid &&
    shouldStretchWidth
  ) {
    resolvedWidth = '100%';
  }

  let sizeX = resolveRobloxSize(resolvedWidth, options.useScale);
  let sizeY = resolveRobloxSize(heightValue, options.useScale);

  if (kind === 'ImageLabel' && sizeX.auto && sizeY.auto) {
    sizeX = resolveRobloxSize('100px', options.useScale);
    sizeY = resolveRobloxSize('100px', options.useScale);
  }

  let automaticSize: RobloxNode['automaticSize'] = null;
  if (sizeX.auto || sizeY.auto) {
    if (sizeX.auto && sizeY.auto) automaticSize = 'XY';
    else if (sizeX.auto) automaticSize = 'X';
    else automaticSize = 'Y';
  }

  const padding = getPadding(styles);
  const margin = getMargin(styles);

  const flexValue = styles['flex'];
  const flexItem = !!flexValue && flexValue !== 'none' && flexValue !== '0' && flexValue !== '0 1 auto';

  const opacity = parseOpacity(styles['opacity']);
  let backgroundGradient = parseLinearGradient(styles['background'] || styles['background-image']);
  let backgroundColor = parseCssColor(styles['background-color'] || styles['background']);
  let textColor = parseCssColor(styles['color']);

  if (!backgroundColor && backgroundGradient?.stops.length) {
    backgroundColor = backgroundGradient.stops[0].color;
  }

  if (opacity !== null) {
    if (backgroundColor) {
      backgroundColor = { ...backgroundColor, a: backgroundColor.a * opacity };
    }
    if (textColor) {
      textColor = { ...textColor, a: textColor.a * opacity };
    }
    if (backgroundGradient) {
      backgroundGradient = {
        ...backgroundGradient,
        stops: backgroundGradient.stops.map((stop) => ({
          ...stop,
          color: { ...stop.color, a: stop.color.a * opacity },
        })),
      };
    }
  }
  const borderRadius = styles['border-radius'] ? parseNumber(styles['border-radius']) : null;
  const fontSize = styles['font-size'] ? parseNumber(styles['font-size']) : null;
  const fontWeight = parseFontWeight(styles['font-weight']);
  let textAlign = parseTextAlign(styles['text-align']);
  if (!styles['text-align'] && kind === 'TextButton') {
    textAlign = 'center';
  }
  const overflow = (styles['overflow'] || '').trim().toLowerCase();
  const clipsDescendants = overflow === 'hidden' || overflow === 'clip';
  const imageSrc = tagName === 'img' ? element.getAttribute('src') : null;
  const border = parseBorder(styles);

  return {
    name,
    kind,
    tagName,
    text: directText,
    styles,
    children,
    size: { x: sizeX, y: sizeY },
    automaticSize,
    padding,
    margin,
    layout,
    flexItem,
    backgroundColor,
    backgroundGradient,
    textColor,
    borderRadius,
    fontSize,
    fontWeight,
    textAlign,
    clipsDescendants,
    opacity,
    imageSrc,
    border,
  };
};

const buildRobloxTreeFromHtml = (html: string, options: ConversionOptions) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rules = parseCssRules(extractStyleText(doc));
  const bodyStyles = computeStylesForElement(doc.body, rules);
  const bodyInherited = pickTextStyles(bodyStyles);

  const counts: Record<string, number> = {
    Frame: 0,
    TextLabel: 0,
    TextButton: 0,
    ImageLabel: 0,
  };

  const nodes: RobloxNode[] = [];
  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const textNode = buildTextNode(text, bodyInherited, options, counts);
      if (textNode) nodes.push(textNode);
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as Element;
    if (element.tagName.toLowerCase() === 'style' || element.tagName.toLowerCase() === 'script') {
      return;
    }
    const built = buildRobloxNode(element, rules, options, counts, bodyInherited, null);
    if (built) nodes.push(built);
  });

  return nodes;
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

const estimateTextHeight = (node: RobloxNode) => {
  const fontSize = node.fontSize || 14;
  const padding = node.padding ? node.padding.top + node.padding.bottom : 0;
  const lineHeightRaw = node.styles['line-height'];
  let lineHeight = fontSize * 1.2;
  if (lineHeightRaw) {
    const trimmed = lineHeightRaw.trim().toLowerCase();
    if (trimmed.endsWith('px') || trimmed.endsWith('rem') || trimmed.endsWith('em')) {
      lineHeight = parseNumber(trimmed);
    } else {
      const num = parseFloat(trimmed);
      if (!Number.isNaN(num)) lineHeight = num * fontSize;
    }
  }
  return lineHeight + padding;
};

const estimateNodeHeight = (node: RobloxNode): number | null => {
  if (!node.size.y.auto) return node.size.y.offset;

  if (node.kind === 'TextLabel' || node.kind === 'TextButton') {
    return estimateTextHeight(node);
  }

  if (node.layout?.kind === 'flex') {
    const padding = node.padding ? node.padding.top + node.padding.bottom : 0;
    if (node.layout.direction === 'Vertical') {
      let total = padding;
      node.children.forEach((child, index) => {
        const childHeight = estimateNodeHeight(child);
        if (childHeight) total += childHeight;
        if (index < node.children.length - 1) total += node.layout!.gapY;
      });
      return total || null;
    }

    const tallest = node.children
      .map((child) => estimateNodeHeight(child) || 0)
      .reduce((max, value) => Math.max(max, value), 0);
    return tallest ? tallest + padding : null;
  }

  return null;
};

const estimateGridCellSize = (node: RobloxNode) => {
  if (!node.layout || node.layout.kind !== 'grid') return null;
  const columns = Math.max(1, node.layout.columns);
  let widthScale = 0;
  let widthOffset = 0;

  if (!node.size.x.auto) {
    if (node.size.x.scale > 0) {
      widthScale = node.size.x.scale / columns;
      widthOffset = node.size.x.offset / columns;
    } else {
      const paddingX = node.padding ? node.padding.left + node.padding.right : 0;
      const gapTotal = node.layout.gapX * (columns - 1);
      const available = node.size.x.offset - paddingX - gapTotal;
      const cellWidth = available > 0 ? available / columns : node.size.x.offset / columns;
      widthOffset = Math.round(cellWidth);
    }
  } else {
    widthScale = 1 / columns;
  }

  if (widthScale > 0 && node.layout.gapX) {
    widthOffset -= Math.round((node.layout.gapX * (columns - 1)) / columns);
  }

  const firstChild = node.children[0];
  const estimatedHeight = firstChild ? estimateNodeHeight(firstChild) : null;
  const heightOffset = Math.round(estimatedHeight || 80);

  return {
    x: { scale: widthScale, offset: widthOffset },
    y: { scale: 0, offset: heightOffset },
  };
};

const injectFlexSpacers = (nodes: RobloxNode[]) => {
  let spacerId = 0;

  const makeSpacer = (): RobloxNode => {
    spacerId += 1;
    return {
      name: `FlexSpacer${spacerId}`,
      kind: 'Frame',
      tagName: '#spacer',
      text: '',
      styles: {},
      children: [],
      size: {
        x: { scale: 0, offset: 0, auto: false },
        y: { scale: 0, offset: 0, auto: false },
      },
      automaticSize: null,
      padding: null,
      margin: null,
      layout: null,
      flexItem: true,
      backgroundColor: null,
      backgroundGradient: null,
      textColor: null,
      borderRadius: null,
      fontSize: null,
      fontWeight: null,
      textAlign: 'left',
      clipsDescendants: false,
      opacity: null,
      imageSrc: null,
      border: null,
    };
  };

  const apply = (node: RobloxNode) => {
    if (node.layout?.kind === 'flex' && node.children.length > 1) {
      const raw = (node.layout.justifyRaw || '').trim().toLowerCase();
      const isBetween = raw === 'space-between';
      const isAround = raw === 'space-around' || raw === 'space-evenly';

      if (isBetween || isAround) {
        const spaced: RobloxNode[] = [];
        if (isAround) spaced.push(makeSpacer());
        node.children.forEach((child, index) => {
          spaced.push(child);
          if (index < node.children.length - 1) {
            spaced.push(makeSpacer());
          } else if (isAround) {
            spaced.push(makeSpacer());
          }
        });
        node.children = spaced;
        node.layout.justify = 'Start';
        node.layout.justifyRaw = 'flex-start';
      }
    }

    node.children.forEach(apply);
  };

  nodes.forEach(apply);
};

const gradientStopsToLua = (stops: GradientStop[], mapper: (stop: GradientStop) => string) =>
  stops.map(mapper).join(', ');

const gradientToLua = (node: RobloxNode, indent: string) => {
  if (!node.backgroundGradient) return '';
  const gradient = node.backgroundGradient;
  const colorSequence = gradientStopsToLua(
    gradient.stops,
    (stop) => `ColorSequenceKeypoint.new(${formatNumber(stop.position)}, ${colorToLua(stop.color)})`
  );
  const transparencyStops = gradient.stops.some((stop) => stop.color.a < 1)
    ? gradientStopsToLua(
      gradient.stops,
      (stop) => `NumberSequenceKeypoint.new(${formatNumber(stop.position)}, ${formatNumber(1 - stop.color.a)})`
    )
    : null;

  let output = `${indent}local ${node.name}Gradient = Instance.new("UIGradient")\n`;
  output += `${indent}${node.name}Gradient.Color = ColorSequence.new({ ${colorSequence} })\n`;
  if (transparencyStops) {
    output += `${indent}${node.name}Gradient.Transparency = NumberSequence.new({ ${transparencyStops} })\n`;
  }
  if (gradient.angle !== null) {
    output += `${indent}${node.name}Gradient.Rotation = ${formatNumber(gradient.angle)}\n`;
  }
  output += `${indent}${node.name}Gradient.Parent = ${node.name}\n`;
  return output;
};

const escapeLuaString = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

const mapHorizontalAlignment = (value: 'Start' | 'Center' | 'End') => {
  if (value === 'Center') return 'Enum.HorizontalAlignment.Center';
  if (value === 'End') return 'Enum.HorizontalAlignment.Right';
  return 'Enum.HorizontalAlignment.Left';
};

const mapVerticalAlignment = (value: 'Start' | 'Center' | 'End') => {
  if (value === 'Center') return 'Enum.VerticalAlignment.Center';
  if (value === 'End') return 'Enum.VerticalAlignment.Bottom';
  return 'Enum.VerticalAlignment.Top';
};

const robloxNodesToLua = (nodes: RobloxNode[]) => {
  let output = '-- Generated Roblox Lua GUI Code\n';
  output += 'local ScreenGui = Instance.new("ScreenGui")\n';
  output += 'ScreenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")\n\n';

  const renderNode = (node: RobloxNode, parent: string, depth: number) => {
    const indent = '  '.repeat(depth);
    output += `${indent}local ${node.name} = Instance.new("${node.kind}")\n`;
    output += `${indent}${node.name}.Name = "${node.name}"\n`;
    output += `${indent}${node.name}.Parent = ${parent}\n`;

    if (node.backgroundGradient) {
      const baseColor = node.backgroundColor || node.backgroundGradient.stops[0]?.color;
      if (baseColor) {
        output += `${indent}${node.name}.BackgroundColor3 = ${colorToLua({ ...baseColor, a: 1 })}\n`;
      }
      output += `${indent}${node.name}.BackgroundTransparency = 0\n`;
    } else if (node.backgroundColor && node.backgroundColor.a > 0) {
      output += `${indent}${node.name}.BackgroundColor3 = ${colorToLua(node.backgroundColor)}\n`;
      if (node.backgroundColor.a < 1) {
        output += `${indent}${node.name}.BackgroundTransparency = ${formatNumber(1 - node.backgroundColor.a)}\n`;
      }
    } else {
      output += `${indent}${node.name}.BackgroundTransparency = 1\n`;
    }

    const sizeX = node.size.x;
    const sizeY = node.size.y;
    output += `${indent}${node.name}.Size = UDim2.new(${formatNumber(sizeX.scale)}, ${Math.round(sizeX.offset)}, ${formatNumber(sizeY.scale)}, ${Math.round(sizeY.offset)})\n`;

    if (node.automaticSize) {
      output += `${indent}${node.name}.AutomaticSize = Enum.AutomaticSize.${node.automaticSize}\n`;
    }

    output += `${indent}${node.name}.Position = UDim2.new(0, 0, 0, 0)\n`;
    if (node.clipsDescendants) {
      output += `${indent}${node.name}.ClipsDescendants = true\n`;
    }

    if (node.kind === 'TextLabel' || node.kind === 'TextButton') {
      output += `${indent}${node.name}.Text = "${escapeLuaString(node.text || '')}"\n`;
      if (node.textColor) {
        if (node.textColor.a > 0) {
          output += `${indent}${node.name}.TextColor3 = ${colorToLua(node.textColor)}\n`;
          if (node.textColor.a < 1) {
            output += `${indent}${node.name}.TextTransparency = ${formatNumber(1 - node.textColor.a)}\n`;
          }
        } else {
          output += `${indent}${node.name}.TextTransparency = 1\n`;
        }
      }

      if (node.fontSize) {
        output += `${indent}${node.name}.TextSize = ${Math.round(node.fontSize)}\n`;
      }

      output += `${indent}${node.name}.Font = Enum.Font.SourceSans\n`;

      const shouldWrap = !(node.automaticSize === 'X' || node.automaticSize === 'XY');
      output += `${indent}${node.name}.TextWrapped = ${shouldWrap ? 'true' : 'false'}\n`;

      if (node.textAlign === 'center') {
        output += `${indent}${node.name}.TextXAlignment = Enum.TextXAlignment.Center\n`;
      } else if (node.textAlign === 'right') {
        output += `${indent}${node.name}.TextXAlignment = Enum.TextXAlignment.Right\n`;
      } else {
        output += `${indent}${node.name}.TextXAlignment = Enum.TextXAlignment.Left\n`;
      }

      if (node.kind === 'TextLabel' && !node.backgroundColor) {
        output += `${indent}${node.name}.BackgroundTransparency = 1\n`;
      }
    }

    if (node.imageSrc && node.kind === 'ImageLabel') {
      output += `${indent}${node.name}.Image = "${escapeLuaString(node.imageSrc)}"\n`;
    }

    if (node.borderRadius) {
      output += `${indent}local ${node.name}Corner = Instance.new("UICorner")\n`;
      output += `${indent}${node.name}Corner.CornerRadius = UDim.new(0, ${Math.round(node.borderRadius)})\n`;
      output += `${indent}${node.name}Corner.Parent = ${node.name}\n`;
    }

    if (node.border) {
      output += `${indent}local ${node.name}Stroke = Instance.new("UIStroke")\n`;
      output += `${indent}${node.name}Stroke.Thickness = ${Math.round(node.border.thickness)}\n`;
      output += `${indent}${node.name}Stroke.Color = ${colorToLua(node.border.color)}\n`;
      output += `${indent}${node.name}Stroke.Parent = ${node.name}\n`;
    }

    if (node.padding) {
      output += `${indent}local ${node.name}Padding = Instance.new("UIPadding")\n`;
      output += `${indent}${node.name}Padding.PaddingTop = UDim.new(0, ${Math.round(node.padding.top)})\n`;
      output += `${indent}${node.name}Padding.PaddingBottom = UDim.new(0, ${Math.round(node.padding.bottom)})\n`;
      output += `${indent}${node.name}Padding.PaddingLeft = UDim.new(0, ${Math.round(node.padding.left)})\n`;
      output += `${indent}${node.name}Padding.PaddingRight = UDim.new(0, ${Math.round(node.padding.right)})\n`;
      output += `${indent}${node.name}Padding.Parent = ${node.name}\n`;
    }

    if (node.backgroundGradient) {
      output += gradientToLua(node, indent);
    }

    if (node.layout?.kind === 'flex') {
      output += `${indent}local ${node.name}Layout = Instance.new("UIListLayout")\n`;
      output += `${indent}${node.name}Layout.FillDirection = Enum.FillDirection.${node.layout.direction}\n`;
      const gapValue = node.layout.direction === 'Vertical' ? node.layout.gapY : node.layout.gapX;
      if (gapValue) {
        output += `${indent}${node.name}Layout.Padding = UDim.new(0, ${Math.round(gapValue)})\n`;
      }

      if (node.layout.direction === 'Vertical') {
        output += `${indent}${node.name}Layout.HorizontalAlignment = ${mapHorizontalAlignment(node.layout.align)}\n`;
        output += `${indent}${node.name}Layout.VerticalAlignment = ${mapVerticalAlignment(node.layout.justify)}\n`;
      } else {
        output += `${indent}${node.name}Layout.HorizontalAlignment = ${mapHorizontalAlignment(node.layout.justify)}\n`;
        output += `${indent}${node.name}Layout.VerticalAlignment = ${mapVerticalAlignment(node.layout.align)}\n`;
      }

      output += `${indent}${node.name}Layout.Parent = ${node.name}\n`;
    } else if (node.layout?.kind === 'grid') {
      output += `${indent}local ${node.name}Layout = Instance.new("UIGridLayout")\n`;
      output += `${indent}${node.name}Layout.FillDirection = Enum.FillDirection.Horizontal\n`;
      output += `${indent}${node.name}Layout.FillDirectionMaxCells = ${node.layout.columns}\n`;
      if (node.layout.gapX || node.layout.gapY) {
        output += `${indent}${node.name}Layout.CellPadding = UDim2.new(0, ${Math.round(node.layout.gapX)}, 0, ${Math.round(node.layout.gapY)})\n`;
      }
      const cellSize = estimateGridCellSize(node);
      if (cellSize) {
        output += `${indent}${node.name}Layout.CellSize = UDim2.new(${formatNumber(cellSize.x.scale)}, ${Math.round(cellSize.x.offset)}, ${formatNumber(cellSize.y.scale)}, ${Math.round(cellSize.y.offset)})\n`;
      }
      output += `${indent}${node.name}Layout.Parent = ${node.name}\n`;
    }

    if (node.flexItem) {
      output += `${indent}local ${node.name}Flex = Instance.new("UIFlexItem")\n`;
      output += `${indent}${node.name}Flex.FlexMode = Enum.UIFlexMode.Fill\n`;
      output += `${indent}${node.name}Flex.FlexGrow = 1\n`;
      output += `${indent}${node.name}Flex.FlexShrink = 1\n`;
      output += `${indent}${node.name}Flex.Parent = ${node.name}\n`;
    }

    output += '\n';

    node.children.forEach((child) => {
      renderNode(child, node.name, depth + 1);
    });
  };

  nodes.forEach((node) => renderNode(node, 'ScreenGui', 1));
  return output;
};

const sizeToCss = (size: RobloxSize) => {
  if (size.auto) return 'auto';
  const parts: string[] = [];
  if (size.scale) parts.push(`${formatNumber(size.scale * 100)}%`);
  if (size.offset) parts.push(`${Math.round(size.offset)}px`);
  if (parts.length === 0) return '0px';
  if (parts.length === 1) return parts[0];
  return `calc(${parts.join(' + ')})`;
};

const alignToCss = (value: 'Start' | 'Center' | 'End') => {
  if (value === 'Center') return 'center';
  if (value === 'End') return 'flex-end';
  return 'flex-start';
};

const normalizeFlexAlignValue = (value: string) => {
  if (value === 'start') return 'flex-start';
  if (value === 'end') return 'flex-end';
  return value;
};

const robloxNodeToCss = (node: RobloxNode) => {
  const parts: string[] = ['box-sizing: border-box', 'position: relative'];
  const autoSizingX = node.automaticSize === 'X' || node.automaticSize === 'XY';
  const autoSizingY = node.automaticSize === 'Y' || node.automaticSize === 'XY';

  let widthCss = sizeToCss(node.size.x);
  let heightCss = sizeToCss(node.size.y);
  let minWidthCss = '';
  let minHeightCss = '';

  if (autoSizingX) {
    widthCss = 'auto';
    minWidthCss = 'fit-content';
  }
  if (autoSizingY) {
    heightCss = 'auto';
    minHeightCss = 'fit-content';
  }

  if (widthCss) parts.push(`width: ${widthCss}`);
  if (heightCss) parts.push(`height: ${heightCss}`);
  if (minWidthCss) parts.push(`min-width: ${minWidthCss}`);
  if (minHeightCss) parts.push(`min-height: ${minHeightCss}`);

  if (node.backgroundColor && node.backgroundColor.a > 0) {
    parts.push(`background-color: ${colorToCss(node.backgroundColor)}`);
  } else if (node.backgroundGradient?.stops[0]) {
    parts.push(`background-color: ${colorToCss(node.backgroundGradient.stops[0].color)}`);
  }

  if (node.backgroundGradient) {
    parts.push(`background-image: ${node.backgroundGradient.raw}`);
  }

  if (node.borderRadius) {
    parts.push(`border-radius: ${Math.round(node.borderRadius)}px`);
  }

  if (node.border) {
    parts.push(`border: ${Math.round(node.border.thickness)}px solid ${colorToCss(node.border.color)}`);
  }

  if (node.clipsDescendants) {
    parts.push('overflow: hidden');
  }

  if (node.padding) {
    parts.push(
      `padding: ${Math.round(node.padding.top)}px ${Math.round(node.padding.right)}px ${Math.round(node.padding.bottom)}px ${Math.round(node.padding.left)}px`
    );
  }

  if (node.margin) {
    parts.push(
      `margin: ${Math.round(node.margin.top)}px ${Math.round(node.margin.right)}px ${Math.round(node.margin.bottom)}px ${Math.round(node.margin.left)}px`
    );
  }

  const boxShadow = node.styles['box-shadow'];
  if (boxShadow) {
    parts.push(`box-shadow: ${boxShadow}`);
  }

  const filter = node.styles['filter'];
  if (filter) {
    parts.push(`filter: ${filter}`);
  }

  const backdropFilter = node.styles['backdrop-filter'];
  if (backdropFilter) {
    parts.push(`backdrop-filter: ${backdropFilter}`);
  }

  if (node.layout?.kind === 'flex') {
    parts.push('display: flex');
    parts.push(`flex-direction: ${node.layout.direction === 'Vertical' ? 'column' : 'row'}`);
    if (node.layout.gapX) {
      parts.push(`column-gap: ${Math.round(node.layout.gapX)}px`);
    }
    if (node.layout.gapY) {
      parts.push(`row-gap: ${Math.round(node.layout.gapY)}px`);
    }
    const justifyCss = node.layout.justifyRaw
      ? normalizeFlexAlignValue(node.layout.justifyRaw)
      : alignToCss(node.layout.justify);
    parts.push(`justify-content: ${justifyCss}`);
    const rawAlign = node.layout.alignRaw || (node.styles['align-items'] || '').trim().toLowerCase();
    const alignItemsCss = rawAlign ? normalizeFlexAlignValue(rawAlign) : 'stretch';
    parts.push(`align-items: ${alignItemsCss}`);
  } else if (node.layout?.kind === 'grid') {
    parts.push('display: grid');
    parts.push(`grid-template-columns: repeat(${node.layout.columns}, minmax(0, 1fr))`);
    if (node.layout.gapX) {
      parts.push(`column-gap: ${Math.round(node.layout.gapX)}px`);
    }
    if (node.layout.gapY) {
      parts.push(`row-gap: ${Math.round(node.layout.gapY)}px`);
    }
  }

  if (node.flexItem) {
    parts.push('flex: 1 1 0%');
    parts.push('min-width: 0');
  }

  if (node.kind === 'TextLabel' || node.kind === 'TextButton') {
    const textDisplay = node.automaticSize === 'X' || node.automaticSize === 'XY' ? 'inline-flex' : 'flex';
    parts.push(`display: ${textDisplay}`);
    parts.push('align-items: center');
    parts.push(`justify-content: ${node.textAlign === 'left' ? 'flex-start' : node.textAlign === 'right' ? 'flex-end' : 'center'}`);
    parts.push(`text-align: ${node.textAlign}`);
    parts.push('white-space: pre-wrap');
    const lineHeight = node.styles['line-height'] || '1.2';
    parts.push(`line-height: ${lineHeight}`);

    if (node.textColor) {
      parts.push(`color: ${colorToCss(node.textColor)}`);
    }

    if (node.fontSize) {
      parts.push(`font-size: ${Math.round(node.fontSize)}px`);
    }

    if (node.fontWeight) {
      parts.push(`font-weight: ${node.fontWeight}`);
    }

    const fontFamily = node.styles['font-family'];
    if (fontFamily) {
      parts.push(`font-family: ${fontFamily}`);
    }

    const fontStyle = node.styles['font-style'];
    if (fontStyle) {
      parts.push(`font-style: ${fontStyle}`);
    }

    const letterSpacing = node.styles['letter-spacing'];
    if (letterSpacing) {
      parts.push(`letter-spacing: ${letterSpacing}`);
    }

    const textTransform = node.styles['text-transform'];
    if (textTransform) {
      parts.push(`text-transform: ${textTransform}`);
    }
  }

  if (node.kind === 'TextButton') {
    parts.push('cursor: pointer');
    parts.push('user-select: none');
  }

  if (node.kind === 'ImageLabel' && node.imageSrc) {
    parts.push(`background-image: url(${JSON.stringify(node.imageSrc)})`);
    parts.push('background-repeat: no-repeat');
    parts.push('background-size: 100% 100%');
    parts.push('background-position: center');
  }

  return parts.join('; ');
};

const robloxNodeToHtml = (node: RobloxNode): string => {
  const classes = ['rbx-node'];
  if (node.kind === 'TextLabel') classes.push('rbx-text');
  if (node.kind === 'TextButton') classes.push('rbx-button');
  if (node.kind === 'ImageLabel') classes.push('rbx-image');

  const attrs: string[] = [];
  attrs.push(`class=\"${classes.join(' ')}\"`);
  attrs.push(`data-rbx-type=\"${node.kind}\"`);
  attrs.push(`data-rbx-name=\"${node.name}\"`);
  if (node.tagName) attrs.push(`data-src-tag=\"${node.tagName}\"`);
  const style = robloxNodeToCss(node);
  if (style) attrs.push(`style=\"${escapeHtml(style)}\"`);

  const content = `${escapeHtml(node.text || '')}${node.children.map(robloxNodeToHtml).join('')}`;
  return `<div ${attrs.join(' ')}>${content}</div>`;
};

const robloxNodesToDebugHtml = (nodes: RobloxNode[]) => {
  const content = nodes.map(robloxNodeToHtml).join('');
  const wrapperStyle = [
    'box-sizing: border-box',
    'font-family: GothamSSm, -apple-system, BlinkMacSystemFont, sans-serif',
    'font-size: 14px',
    'min-height: 100%',
    'width: 100%',
  ].join('; ');
  return `<div class=\"rbx-preview\" style=\"${wrapperStyle}\">${content}</div>`;
};

const RobloxGuiConverter = () => {
  const [inputCode, setInputCode] = useState(`<div style="display: flex; flex-direction: column; gap: 10px; padding: 20px; background-color: #2c3e50; border-radius: 10px;">
  <h1 style="color: white; font-size: 24px; margin: 0;">Welcome to Roblox</h1>
  <button style="background-color: #3498db; color: white; padding: 12px 24px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Click Me</button>
  <div style="display: flex; gap: 10px;">
    <div style="flex: 1; background-color: #e74c3c; padding: 15px; border-radius: 5px; color: white;">Box 1</div>
    <div style="flex: 1; background-color: #2ecc71; padding: 15px; border-radius: 5px; color: white;">Box 2</div>
  </div>
</div>`);
  const [useScale, setUseScale] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('previews');
  const [inputType, setInputType] = useState('html');
  const [babel, setBabel] = useState<any>(null);
  const [babelError, setBabelError] = useState<string | null>(null);

  const { html: processedHtml, error: processedHtmlError } = useMemo(() => {
    if (inputType !== 'jsx') return { html: inputCode, error: null };
    if (babelError) {
      const fallback = `<div style="padding:16px;color:#b91c1c;font-family:monospace;">Babel load error: ${babelError}</div>`;
      return { html: fallback, error: babelError };
    }
    if (!babel) {
      const fallback = '<div style="padding:16px;font-family:monospace;color:#0f172a;">Loading Babel compiler...</div>';
      return { html: fallback, error: null };
    }
    try {
      const html = jsxFileToHtml(inputCode, babel);
      return { html, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const fallback = `<div style="padding:16px;color:#b91c1c;font-family:monospace;">JSX parse error: ${msg}</div>`;
      return { html: fallback, error: msg };
    }
  }, [inputCode, inputType, babel, babelError]);

  useEffect(() => {
    if (inputType !== 'jsx' || babel || babelError) return;
    let active = true;
    import('@babel/standalone')
      .then((mod) => {
        if (!active) return;
        const resolved = (mod as any).default || mod;
        setBabel(resolved);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        setBabelError(msg);
      });
    return () => {
      active = false;
    };
  }, [inputType, babel, babelError]);

  const conversion = useMemo(() => {
    if (inputType === 'jsx' && !babel && !babelError) {
      const msg = 'Loading Babel compiler...';
      const debugHtml = `<div style="padding:16px;font-family:monospace;color:#0f172a;">${msg}</div>`;
      return { lua: `-- ${msg}\n`, debugHtml, error: null };
    }
    if (processedHtmlError) {
      const msg = `JSX parse error: ${processedHtmlError}`;
      const debugHtml = `<div style="padding:16px;color:#b91c1c;font-family:monospace;">${escapeHtml(msg)}</div>`;
      return { lua: `-- ${msg}\n`, debugHtml, error: processedHtmlError };
    }
    try {
      const nodes = buildRobloxTreeFromHtml(processedHtml, { useScale });
      injectFlexSpacers(nodes);
      const lua = robloxNodesToLua(nodes);
      const debugHtml = robloxNodesToDebugHtml(nodes);
      return { lua, debugHtml, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const debugHtml = `<div style="padding:16px;color:#b91c1c;font-family:monospace;">Conversion error: ${escapeHtml(msg)}</div>`;
      return { lua: `-- Conversion error: ${msg}\n`, debugHtml, error: msg };
    }
  }, [processedHtml, processedHtmlError, useScale, inputType, babel, babelError]);

  const luaCode = conversion.lua;
  const robloxPreviewHtml = conversion.debugHtml;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setInputCode(result);
          setInputType('jsx');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(luaCode);
  };

  const downloadLua = () => {
    const blob = new Blob([luaCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roblox_gui.lua';
    a.click();
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">HTML/CSS/React → Roblox Lua Converter</h1>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2 transition cursor-pointer">
            <Upload size={18} />
            Upload .jsx
            <input
              type="file"
              accept=".jsx,.js,.tsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${showSettings ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Settings size={18} />
            Settings
          </button>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition"
          >
            <Copy size={18} />
            Copy Lua
          </button>
          <button
            onClick={downloadLua}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2 transition"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useScale}
                onChange={(e) => setUseScale(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Use Scale sizing (responsive) instead of Offset (fixed pixels)</span>
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Input Type:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'html'}
                  onChange={() => setInputType('html')}
                  className="w-4 h-4"
                />
                <span>HTML/CSS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'jsx'}
                  onChange={() => setInputType('jsx')}
                  className="w-4 h-4"
                />
                <span>JSX/React</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 flex">
          <button
            onClick={() => setActiveTab('previews')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'previews' 
                ? 'bg-gray-700 border-b-2 border-blue-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            Preview Comparison
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'code' 
                ? 'bg-gray-700 border-b-2 border-blue-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            Code Editor
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'previews' ? (
            <>
              <div className="w-1/2 flex flex-col border-r border-gray-700">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg">
                  HTML Live Preview
                </div>
                <div className="flex-1 p-6 bg-white overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                </div>
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg">
                  Roblox Preview
                </div>
                <div className="flex-1 p-6 bg-white overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: robloxPreviewHtml }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-1/2 flex flex-col border-r border-gray-700">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg flex justify-between items-center">
                  <span>{inputType === 'jsx' ? 'JSX/React' : 'HTML/CSS'} Input</span>
                  <span className="text-xs text-gray-400">Edit your code here</span>
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-base resize-none focus:outline-none leading-relaxed"
                  spellCheck="false"
                />
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg flex justify-between items-center">
                  <span>Roblox Lua Output</span>
                  <span className="text-xs text-gray-400">Copy & paste into Roblox Studio</span>
                </div>
                <pre className="flex-1 p-4 bg-gray-900 text-blue-400 font-mono text-base overflow-auto leading-relaxed">
                  {luaCode}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobloxGuiConverter;
