import { Router } from 'express';
const router = Router();
import { users } from '../config/mongoCollections.js';

router.get('/', async (req, res) => {
    try {
        // Fetch user data from the database
        const userCollection = await users();
        console.log("DB connected");
        const userData = await userCollection.find({}, { projection: { firstName: 1, lastName: 1, _id: 1 } }).toArray();

        res.json(userData);
    } catch (e) {
        console.error('Error fetching user data:', e.message);
        res.status(500).json({ error: e });
    }
});

export default router;