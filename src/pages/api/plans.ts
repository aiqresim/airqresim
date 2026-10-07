import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const currency = req.query.currency || 'EUR';
    const { currency } = req.query;
    const plans = await db.planPrices.findMany({
        where: { currency },
    });
    res.json(plans);
}