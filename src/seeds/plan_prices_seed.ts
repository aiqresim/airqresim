import { getConnection } from 'typeorm';
import { PlanPrices } from '../entities/PlanPrices';

export const seedPlanPrices = async () => {
  const connection = getConnection();
  const planPricesRepository = connection.getRepository(PlanPrices);

  const plans = await planPricesRepository.find();

  for (const plan of plans) {
    await planPricesRepository.save({
      plan_id: plan.id,
      currency: 'RUB',
      price_cents: plan.price_cents * 100,
    });
  }
};