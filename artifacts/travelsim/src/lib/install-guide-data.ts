export interface InstallStep {
  /** Base translation key for this step, e.g. ``install.iphone.s1_t``. */
  key: string;
}

export interface InstallGuide {
  key: 'iphone' | 'android';
  label: string;
  /** Translation key for the Settings breadcrumb shown above the steps. */
  menuKey: string;
  /** Step keys, in order, relative to `install.<platform>.`. */
  steps: string[];
  /** Translation keys for the "good to know" bullets. */
  tips: string[];
}

/**
 * Steps and tips are addressed by key so all copy lives in the locale files.
 * Step keys map to `<platform>.sN_t` / `<platform>.sN_d` / `<platform>.sN_shot`.
 */
export const GUIDES: InstallGuide[] = [
  {
    key: 'iphone',
    label: 'iPhone',
    menuKey: 'install.iphone_menu',
    steps: ['s1', 's2', 's3', 's4', 's5', 's6'],
    tips: ['t1', 't2'],
  },
  {
    key: 'android',
    label: 'Android',
    menuKey: 'install.android_menu',
    steps: ['s1', 's2', 's3', 's4', 's5'],
    tips: ['t1', 't2'],
  },
];