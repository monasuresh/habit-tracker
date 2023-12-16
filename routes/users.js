import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import { users, groups } from '../config/mongoCollections.js';

router.get('/', async (req, res) => {
    console.log("I am in get users routes")
    try {
        // Fetch user data from the database
        const userCollection = await users();
        console.log("DB connected");
        const userData = await userCollection.find({}, { projection: { firstName: 1, lastName: 1, _id: 1 } }).toArray();

        // Send the user data as JSON
        console.log(userData);
        //const userDataText = JSON.stringify(userData);
        //res.send(userDataText);
        res.json(userData);
        //res.redirect('/groups');
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    //res.re('groups');
});

export default router;