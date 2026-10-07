import { and, eq } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import { countries, plans } from "@workspace/db/schema";

const countrySeeds = [
  ["turkey", "Turkey", "🇹🇷", "Europe & Middle East", "Операторы: Turkcell, Vodafone TR, Türk Telekom. Отличное покрытие 4G, 5G в Стамбуле/Анкаре/Измире. В курортных зонах скорость стабильная."],
  ["uae", "UAE", "🇦🇪", "Europe & Middle East", "Операторы: Etisalat, du. Отличное покрытие. ВАЖНО: VoIP-звонки (WhatsApp, Skype) заблокированы — используйте eSIM для интернета, звонки через другие приложения."],
  ["italy", "Italy", "🇮🇹", "Europe", "Операторы: TIM, Vodafone IT, WindTre. Хорошее покрытие по всей стране, 5G в крупных городах. В горах возможны перебои."],
  ["china", "China", "🇨🇳", "Asia", "Операторы: China Mobile, China Unicom. ВАЖНО: Google, Facebook, Instagram, WhatsApp заблокированы. Установите VPN ДО поездки."],
  ["usa", "USA", "🇺🇸", "Americas", "Операторы: T-Mobile, AT&T, Verizon. Отличное покрытие, 5G в городах. В национальных парках связь слабая."],
  ["thailand", "Thailand", "🇹🇭", "Asia", "Операторы: AIS, dtac, TrueMove. Отличное покрытие, дешёвый интернет. 5G в Бангкоке и туристических зонах."],
  ["france", "France", "🇫🇷", "Europe", "Операторы: Orange, SFR, Bouygues, Free. Хорошее покрытие, 5G в Париже и крупных городах."],
  ["germany", "Germany", "🇩🇪", "Europe", "Операторы: Telekom, Vodafone, O2. Отличное покрытие, 5G везде. В подземке Берлина связь может пропадать."],
  ["spain", "Spain", "🇪🇸", "Europe", "Операторы: Movistar, Vodafone, Orange. Хорошее покрытие, 5G в Мадриде/Барселоне."],
  ["japan", "Japan", "🇯🇵", "Asia", "Операторы: NTT Docomo, SoftBank, au. Отличное покрытие, 5G в Токио/Осаке. В сельской местности скорость ниже."],
] as const;

const planTiers = [
  { dataGb: 1, validityDays: 7, supplier: 500, selling: 999 },
  { dataGb: 5, validityDays: 15, supplier: 900, selling: 1499 },
  { dataGb: 10, validityDays: 30, supplier: 1400, selling: 2499 },
] as const;

async function seed() {
  // Upsert keyed on the unique slug: re-running updates tips/region in place
  // instead of inserting duplicate country rows.
  for (const [slug, name, flagEmoji, region, tips] of countrySeeds) {
    await db
      .insert(countries)
      .values({
        slug,
        name,
        flagEmoji,
        region,
        tips,
        minPriceCents: 999,
      })
      .onConflictDoUpdate({
        target: countries.slug,
        set: { name, flagEmoji, region, tips },
      });
  }

  const seededCountries = await db.select().from(countries);

  for (const country of seededCountries) {
    const existingPlans = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.countryId, country.id))
      .limit(1);

    if (existingPlans.length > 0) continue;

    const tiers = country.slug === "turkey"
      ? [...planTiers, { dataGb: 20, validityDays: 30, supplier: 2400, selling: 3999 }]
      : planTiers;

    await db.insert(plans).values(
      tiers.map((tier) => ({
        countryId: country.id,
        dataGb: tier.dataGb,
        validityDays: tier.validityDays,
        speed: tier.dataGb >= 10 ? "5G" : "4G",
        coverage: `Reliable coverage across ${country.name}`,
        networkOperator: country.name === "Turkey" ? "Turkcell" : "TravelSIM partner network",
        hotspotAllowed: true,
        supplierCostCents: tier.supplier,
        sellingPriceCents: tier.selling,
        currency: "EUR",
      })),
    );
  }

  const seededPlans = await db.select({ countryId: plans.countryId }).from(plans);
  const minPrices = new Map<string, number>();
  for (const plan of await db.select().from(plans)) {
    const current = minPrices.get(plan.countryId);
    if (current === undefined || plan.sellingPriceCents < current) {
      minPrices.set(plan.countryId, plan.sellingPriceCents);
    }
  }
  for (const country of seededCountries) {
    const minPrice = minPrices.get(country.id);
    if (minPrice !== undefined) {
      await db.update(countries).set({ minPriceCents: minPrice }).where(eq(countries.id, country.id));
    }
  }

  console.info(`Seeded ${seededCountries.length} countries and ${seededPlans.length} plans.`);
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});