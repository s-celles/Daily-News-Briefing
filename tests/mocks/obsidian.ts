/**
 * Mock implementation of Obsidian module for testing
 */
import { vi } from 'vitest';

// Mock App class
export class App {
  vault = {
    adapter: {
      exists: vi.fn().mockResolvedValue(false),
      read: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
    },
    create: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
    getAbstractFileByPath: vi.fn().mockReturnValue(null),
    modify: vi.fn().mockResolvedValue(undefined),
  };
  workspace = {
    openLinkText: vi.fn().mockResolvedValue(undefined),
    getLeaf: vi.fn().mockReturnValue({
      openFile: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

// Mock Plugin class
export class Plugin {
  app: App;
  manifest: { id: string; name: string; version: string };

  constructor() {
    this.app = new App();
    this.manifest = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' };
  }

  loadData = vi.fn().mockResolvedValue({});
  saveData = vi.fn().mockResolvedValue(undefined);
  addSettingTab = vi.fn();
  addRibbonIcon = vi.fn().mockReturnValue({ remove: vi.fn() });
  registerInterval = vi.fn().mockReturnValue(0);
  addCommand = vi.fn();
}

// Mock TFile class
export class TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;

  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
    this.basename = this.name.replace(/\.[^/.]+$/, '');
    this.extension = this.name.includes('.') ? this.name.split('.').pop() || '' : '';
  }
}

// Mock TFolder class
export class TFolder {
  path: string;
  name: string;

  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
  }
}

// Mock Notice class
export class Notice {
  message: string;
  duration?: number;

  constructor(message: string, duration?: number) {
    this.message = message;
    this.duration = duration;
  }

  hide = vi.fn();
}

// Mock PluginSettingTab
export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {}
  hide(): void {}
}

// Mock Setting class
export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    this.infoEl = document.createElement('div');
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
    this.controlEl = document.createElement('div');
  }

  setName(name: string): this { return this; }
  setDesc(desc: string): this { return this; }
  setClass(cls: string): this { return this; }
  addText(cb: (text: any) => any): this { return this; }
  addTextArea(cb: (text: any) => any): this { return this; }
  addDropdown(cb: (dropdown: any) => any): this { return this; }
  addToggle(cb: (toggle: any) => any): this { return this; }
  addButton(cb: (button: any) => any): this { return this; }
  addSlider(cb: (slider: any) => any): this { return this; }
}

// Mock Modal class
export class Modal {
  app: App;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  titleEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.containerEl = document.createElement('div');
    this.contentEl = document.createElement('div');
    this.titleEl = document.createElement('div');
  }

  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

// Mock requestUrl function
export const requestUrl = vi.fn().mockImplementation(async (options: any) => {
  return {
    status: 200,
    headers: {},
    text: JSON.stringify({}),
    json: {},
    arrayBuffer: new ArrayBuffer(0),
  };
});

// Mock normalizePath function
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}
