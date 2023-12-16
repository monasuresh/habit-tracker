import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import { users, groups } from '../config/mongoCollections.js';

router.get('/', async (req, res) => {
    try {
        const groupCollection = await groups();
        const groupInfo = await groupCollection.find({}).toArray();

        // Send the user data as JSON
        res.status(200).render('leadershipboard',{groupInfo});
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;