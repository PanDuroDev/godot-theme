// Type definitions for godot-theme (GT) vanilla JS helpers.
// godot.js has no ESM exports — it attaches window.GodotDS. Import for side
// effects: `import 'godot-theme/js'; const { toast } = window.GodotDS;`
export interface GodotDSMenuItem {
  label?: string;
  icon?: string;
  cur?: boolean;
  sep?: boolean;
  disabled?: boolean;
  accel?: string;
  arrow?: boolean;
  checked?: boolean;
  radio?: boolean;
  submenu?: GodotDSMenuItem[];
  value?: string;
  v?: string;
}
export interface GodotDSMenuPickInfo {
  toggled?: boolean;
}
export interface GodotDSApi {
  toast(msg: string, type?: 'info' | 'success' | 'warn' | 'error', title?: string): Element;
  openDialog(id: string): void;
  closeDialog(id: string): void;
  bindDialog(id: string, okId: string | null, cancelId: string | null, onOk?: (() => void) | null): void;
  bindSearch(inputId: string, clearId: string, onFilter?: (value: string) => void): void;
  menu(x: number, y: number, items: GodotDSMenuItem[], onPick?: (item: GodotDSMenuItem, info?: GodotDSMenuPickInfo) => void): Element | null;
  closeMenu(): void;
  ring(el: Element | null, p: number): void;
  optMenu(btn: Element, items: GodotDSMenuItem[], cur: string, onPick?: (value: string, item: GodotDSMenuItem) => void): Element | null;
  tips(scope?: ParentNode): Element;
}
declare global {
  interface Window {
    GodotDS: GodotDSApi;
  }
}
export {};
