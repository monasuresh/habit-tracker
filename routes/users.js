import userValidation from '../helpers/userValidations.js';
import { userData } from '../data/index.js';
import express from 'express';

const router = express.Router();

router
    .route('/')
    .post(async (req, res) => {
        const userDocument = req.body;
        let userParams;

        //make sure there is something present in the req.body
        if (!userDocument || Object.keys(userDocument).length === 0) {
            return res
                .status(400)
                .json({ error: 'There are no fields in the request body' });
        }

        const expectedParams = ['firstname', 'lastname', 'username', 'password', 'emailAddress'];

        const unexpectedParams = Object.keys(userDocument).filter(param => !expectedParams.includes(param));

        if (unexpectedParams.length > 0) {
            return res.status(400).json({ error: `Unexpected parameters: ${unexpectedParams.join(', ')}` });
        }

        try {
            userParams = userValidation.validateUserParams(userDocument.firstname, userDocument.lastname, userDocument.username, userDocument.password, userDocument.emailAddress);
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        //insert the user
        try {
            const newUser = await userData.addUser(userParams.firstname, userParams.lastname, userParams.username, userParams.password, userParams.emailAddress);
            return res.json(newUser);
        } catch (e) {
            return res.status(500).json({ error: e });
        }
    });

export default router;