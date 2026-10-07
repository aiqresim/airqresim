export interface FaqItem {
  /** Translation key for the question, e.g. `faq.items.purchase.buy`. */
  qKey: string;
  /** Translation key for the answer. */
  aKey: string;
}

export interface FaqCategory {
  key: string;
  /** Translation key for the category heading. */
  titleKey: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    key: 'purchase',
    titleKey: 'faq.cat_purchase',
    items: [
      { qKey: 'faq.items.purchase.how_to_buy', aKey: 'faq.items.purchase.how_to_buy_a' },
      { qKey: 'faq.items.purchase.payment_methods', aKey: 'faq.items.purchase.payment_methods_a' },
      { qKey: 'faq.items.purchase.gift', aKey: 'faq.items.purchase.gift_a' },
      { qKey: 'faq.items.purchase.group_discounts', aKey: 'faq.items.purchase.group_discounts_a' },
      { qKey: 'faq.items.purchase.promo_code', aKey: 'faq.items.purchase.promo_code_a' },
    ],
  },
  {
    key: 'installation',
    titleKey: 'faq.cat_installation',
    items: [
      { qKey: 'faq.items.installation.iphone', aKey: 'faq.items.installation.iphone_a' },
      { qKey: 'faq.items.installation.android', aKey: 'faq.items.installation.android_a' },
      { qKey: 'faq.items.installation.how_long', aKey: 'faq.items.installation.how_long_a' },
      { qKey: 'faq.items.installation.qr_fails', aKey: 'faq.items.installation.qr_fails_a' },
      { qKey: 'faq.items.installation.tablet', aKey: 'faq.items.installation.tablet_a' },
    ],
  },
  {
    key: 'usage',
    titleKey: 'faq.cat_usage',
    items: [
      { qKey: 'faq.items.usage.activation', aKey: 'faq.items.usage.activation_a' },
      { qKey: 'faq.items.usage.data_roaming', aKey: 'faq.items.usage.data_roaming_a' },
      { qKey: 'faq.items.usage.physical_sim', aKey: 'faq.items.usage.physical_sim_a' },
      { qKey: 'faq.items.usage.whatsapp', aKey: 'faq.items.usage.whatsapp_a' },
      { qKey: 'faq.items.usage.no_internet', aKey: 'faq.items.usage.no_internet_a' },
    ],
  },
  {
    key: 'refund',
    titleKey: 'faq.cat_refund',
    items: [
      { qKey: 'faq.items.refund.can_refund', aKey: 'faq.items.refund.can_refund_a' },
      { qKey: 'faq.items.refund.not_working', aKey: 'faq.items.refund.not_working_a' },
      { qKey: 'faq.items.refund.contact', aKey: 'faq.items.refund.contact_a' },
      { qKey: 'faq.items.refund.warranty', aKey: 'faq.items.refund.warranty_a' },
    ],
  },
];
