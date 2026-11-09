import type { NextApiRequest, NextApiResponse } from 'next';

export default function quizReward(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
    }

    const rewardUrl = process.env.QUIZ_STEAM_REWARD_URL;
    if (!rewardUrl) {
        return res.status(503).send('Nagroda Steam jest chwilowo niedostępna.');
    }

    return res.redirect(302, rewardUrl);
}
