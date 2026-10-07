/**
 * Static compatibility reference data for the /compatibility page.
 * Kept out of the page component so both the list and the "how to check"
 * instructions stay readable.
 */

export interface DeviceGroup {
  /** Product family, e.g. "iPhone 12". */
  family: string;
  models: string[];
}

export interface PlatformData {
  key: 'iphone' | 'android';
  label: string;
  /** Short intro shown above the list. */
  intro: string;
  groups: DeviceGroup[];
  /** How a user can verify support on a device of this platform. */
  checkSteps: string[];
  checkHint: string;
}

export const PLATFORMS: PlatformData[] = [
  {
    key: 'iphone',
    label: 'iPhone',
    intro:
      'eSIM arrived with iPhone XS / XR in 2018. Every iPhone listed below supports eSIM.',
    groups: [
      {
        family: 'iPhone XS / XR (2018)',
        models: ['iPhone XR', 'iPhone XS', 'iPhone XS Max'],
      },
      {
        family: 'iPhone 11 (2019)',
        models: ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'],
      },
      {
        family: 'iPhone SE (2nd generation, 2020)',
        models: ['iPhone SE (2020)'],
      },
      {
        family: 'iPhone 12 (2020)',
        models: ['iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max'],
      },
      {
        family: 'iPhone 13 (2021)',
        models: ['iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max'],
      },
      {
        family: 'iPhone 14 (2022)',
        models: ['iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max'],
      },
      {
        family: 'iPhone 15 (2023)',
        models: ['iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'],
      },
      {
        family: 'iPhone 16 (2024)',
        models: ['iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max'],
      },
      {
        family: 'iPad with eSIM',
        models: [
          'iPad Pro 11" (2020 and newer)',
          'iPad Pro 12.9" (2020 and newer)',
          'iPad Air (2020 and newer)',
          'iPad mini (2021 and newer)',
        ],
      },
    ],
    checkSteps: [
      'Settings → General → About → scroll down to EID',
      'If an EID row is present, the device supports eSIM',
    ],
    checkHint:
      'iPhone XS, XS Max and XR sold in mainland China have physical dual SIM only and no eSIM. Check the EID on your own device — the model name alone is not enough.',
  },
  {
    key: 'android',
    label: 'Android',
    intro:
      'Support depends on the manufacturer. Most flagships from 2019 onward support eSIM.',
    groups: [
      {
        family: 'Google',
        models: ['Pixel 3', 'Pixel 3a', 'Pixel 4', 'Pixel 5', 'Pixel 6', 'Pixel 7', 'Pixel 8', 'Pixel 9'],
      },
      {
        family: 'Samsung — flagship',
        models: [
          'Galaxy S20',
          'Galaxy S20+',
          'Galaxy S20 Ultra',
          'Galaxy S21 series',
          'Galaxy S22 series',
          'Galaxy S23 series',
          'Galaxy S24 series',
          'Galaxy S25 series',
        ],
      },
      {
        family: 'Samsung — foldables & A-series',
        models: [
          'Galaxy Z Flip',
          'Galaxy Z Flip 5G',
          'Galaxy Z Fold2',
          'Galaxy Z Fold3',
          'Galaxy Z Fold4',
          'Galaxy Z Fold5',
          'Galaxy A54 5G',
        ],
      },
      {
        family: 'Huawei',
        models: ['P40', 'P40 Pro', 'Mate 40 Pro'],
      },
      {
        family: 'Xiaomi',
        models: ['12T Pro', '13', '13 Pro', '14', '14 Pro'],
      },
      {
        family: 'OnePlus',
        models: ['OnePlus 11', 'OnePlus 12', 'OnePlus 13'],
      },
      {
        family: 'Motorola',
        models: ['Razr 5G'],
      },
      {
        family: 'Oppo',
        models: ['Find X3 Pro', 'Find X5 Pro', 'Find X6 Pro'],
      },
      {
        family: 'Sony',
        models: ['Xperia 1 IV', 'Xperia 1 V'],
      },
    ],
    checkSteps: [
      'Settings → About phone → SIM cards → look for an eSIM entry',
      'Alternatively dial *#06# — if an EID is listed, eSIM is supported',
    ],
    checkHint:
      'Regional variants matter: many budget and carrier-locked Android models ship without an eSIM modem even when the global version has one.',
  },
];

export const UNSUPPORTED: string[] = [
  'iPhone X and older — released before eSIM support existed',
  'iPhone XS / XS Max / XR bought in mainland China — dual physical SIM only',
  'Android devices released before 2019, and most budget models',
  'Tablets and phones locked to a specific carrier (SIM-locked variants)',
];

/** Case-insensitive match against family name and every model name. */
export function matchesSearch(platform: PlatformData, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (needle === '') return true;

  return platform.groups.some(
    (group) =>
      group.family.toLowerCase().includes(needle) ||
      group.models.some((model) => model.toLowerCase().includes(needle)),
  );
}