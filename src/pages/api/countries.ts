import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const currency = req.query.currency || 'EUR';
    const { currency } = req.query;
    const countries = await db.countries.findMany();
    const countriesWithPrices = await Promise.all(countries.map(async (country) => {
        const prices = await db.planPrices.findMany({
            where: { currency },
        });
        return { ...country, prices };
    }));
    res.json(countriesWithPrices);
}