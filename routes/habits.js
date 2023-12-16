import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';
import validation from '../validation.js';
import { habits } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router
    .route('/create-habit')
    .get(async (req, res) => {
        try {
            return res.render('habits', { title: 'Habits' });
        } catch (e) {
            return res.status(500).render('error', { message: e });
        }
    })
    .post(async (req, res) => {
        //code here for POST
        const habitDocument = req.body;
        let validHabitParams;
        if (!habitDocument || Object.keys(habitDocument).length === 0) {
            return res
                .status(400)
                .json({ error: 'There are no fields in the request body' });
        }

        try {
            validHabitParams = validation.validateHabitParams(habitDocument.nameInput, habitDocument.effectInput, habitDocument.categoryInput, habitDocument.weightInput, false);
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        try {
            await validation.checkForDuplicateHabitName(validHabitParams.name.toUpperCase());
        } catch (e) {
            return res.status(409).json({ error: e });
        }

        try {
            const newHabit = await habitData.createHabit(validHabitParams.name, validHabitParams.effect, validHabitParams.category, validHabitParams.weight);
            return res.json(newHabit);
        } catch (e) {
            return res.status(500).json({ error: e });
        }
    });

router.route('/track/:habitId').post(async (req, res) => {
    const habitDocument = req.body;
    if (!habitDocument || Object.keys(habitDocument).length === 0) {
        isError = true;
        return res
            .status(400)
            .render('protected', { title: 'Welcome Page', message: 'There are no fields in the request body.', isError: isError });
    }

    let habitId = req.params.habitId;

    let emailAddress;
    if (!req.session.user) {
        return res.status(401).json({ error: 'The current user is unauthorized.' });
    } else {
        emailAddress = req.session.user.emailAddress;
    }

    try {
        habitId = validation.validateIdStrings(habitId);
    } catch (error) {
        return res.status(400).json({error: error});
    }

    if (!emailAddress) {
        return res.status(404).json({error: 'User has not been registered with an email address.'});
    }

    try {
        emailAddress = validation.validateEmailAddress(emailAddress);
    } catch (error) {
        return res.status(400).json({error: error});
    }

    let time;

    try {
        time = validation.isValidTime24HourFormat(habitDocument.reminderTimeInput);
    } catch (error) {
        res.status(400).json({error: error});
    }

    // Check to see if there is a user with the specified email address. If not, throw an error.

    try {
        await validation.checkIfEmailAddressExistsInDb(emailAddress);
    } catch (error) {
        res.status(404).json({error: error});
    }

    const habitCollection = await habits();

    let habit = await habitCollection.findOne({ _id: new ObjectId(habitId) });

    if (!habit) {
        return res.status(404).json({error: 'The habit you are trying to track could not be found'});
    }

    try {
        const trackedHabit = await trackedHabitData.addTrackedHabit(emailAddress, habitId, time);
        return res.json(trackedHabit);
    } catch (e) {
        return res.status(500).json({ error: e })
    }

});

router
    .route('/view-all')
    .get(async (req, res) => {
        try {
            const habitList = await habitData.getAllHabits();
            return res.json(habitList);
        } catch (e) {
            return res.status(500).send(e);
        }
    });

router
    .route('/delete-habit/:habitId')
    .delete(async (req, res) => {
        let deletionId = req.params.habitId;

        try {
            deletionId = validation.validateIdStrings(deletionId);
        } catch (error) {
            return res.status(400).json({ error: error });
        }

        try {
            const deletedHabit = await habitData.deleteHabit(deletionId);
            return res.json(deletedHabit);
        } catch (error) {
            return res.status(404).json({ error: error });
        }

    });

router
    .route('/log-habit')
    .get(async (req, res) => {
        try {
            let emailAddress = req.session.user.emailAddress;
            let habitLogEntry = await habitLogData.getAllHabitLogEntries(emailAddress);
            return res.json(habitLogEntry);
        } catch (e) {
            return res.status(404).json({ error: e });
        }
    })
    .post(async (req, res) => {
        const habitDocument = req.body;
        if (!habitDocument || Object.keys(habitDocument).length === 0) {
            return res.status(400).json({ error: 'At least one parameter must be provided.' });
        }

        let emailAddress;
        if (!req.session.user) {
            return res.status(401).json({ error: 'The current user is unauthorized.' });
        } else {
            emailAddress = req.session.user.emailAddress;
        }

        let trackedHabitName = habitDocument.habitNameInput;
        let date = habitDocument.dateInput;
        let time = habitDocument.timeInput;

        if (typeof trackedHabitName !== 'string') {
            return res.status(400).json({ error: 'The tracked habit name must be of type string' });
        }

        trackedHabitName = trackedHabitName.trim();

        if (trackedHabitName.length === 0) {
            return res.status(400).json({ error: 'The tracked habit name must not be a string with just empty spaces.' });
        }

        trackedHabitName = trackedHabitName.toUpperCase();

        let habitCollection = await habits();
        let habit = await habitCollection.findOne({ 'name': trackedHabitName });

        if (!habit) {
            res.status(404).json({ error: 'No such habit exists in the global habit database.' });
        }

        if (!emailAddress) {
            return res.status(401).json({ error: 'The user has not been authenticated.' });
        }

        if (!emailAddress || !trackedHabitName || !date || !time) {
            return res.status(400).json({ error: 'One or more fields were not supplied.' });
        }

        try {
            emailAddress = validation.validateEmailAddress(emailAddress);
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        try {
            date = validation.isValidHyphenSeparatedDate(date);
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        try {
            time = validation.isValidTime24HourFormat(time);
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        let dateTimeInput = new Date(date + 'T' + time);
        let currentDateTime = new Date();

        if (dateTimeInput > currentDateTime) {
            return res.status(400).json({ error: 'The date/time logged must be not after the current date/time.' });
        }

        try {
            await validation.checkIfEmailAddressExistsInDb(emailAddress);
        } catch (e) {
            return res.status(404).json({ error: e });
        }

        try {
            let habitEntry = await habitLogData.logHabit(emailAddress, trackedHabitName, date, time);
            return res.json(habitEntry);
        } catch (e) {
            return res.status(404).json({ error: e });
        }
    });
router
    .route('/modify/:habitId')
    .get(async (req, res) => {
        try {
            return res.render('modifyHabit', { title: 'Registration Page', id: req.params.habitId });
        } catch (e) {
            return res.status(404).json({ error: e });
        }
    })
    .patch(async (req, res) => {
        let habitInfo = req.body;
        if (!habitInfo || Object.keys(habitInfo).length === 0) {
            return res
                .status(400)
                .json({ error: 'There are no fields in the request body' });
        }

        let habitId = req.params.habitId;

        try {
            habitId = validation.validateIdStrings(habitId);
        } catch (error) {
            return res.status(400).json({ error: error });
        }

        let validHabitParams;

        try {
            validHabitParams = validation.validateHabitParams(habitInfo.nameInput, habitInfo.effectInput, habitInfo.categoryInput, habitInfo.weightInput, true);
        } catch (error) {
            return res.status(400).json({ error: error });
        }

        try {
            const updatedHabit = await habitData.modifyHabit(
                habitId,
                validHabitParams
            );

            return res.json(updatedHabit);
        } catch (e) {
            return res.status(404).send({ error: e });
        }
    });

export default router;