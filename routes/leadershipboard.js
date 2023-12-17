import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import { groups } from '../config/mongoCollections.js';

router.get('/', async (req, res) => {
    try {
        const groupCollection = await groups();
        const groupInfo = await groupCollection.find({}).toArray();

        // Send the user data as JSON
        res.status(200).render('leadershipboard', { title: 'Leadership board', groupInfo });
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

export default router;