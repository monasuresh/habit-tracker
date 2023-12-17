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
        console.log("I am in post create habit");
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
        return res.status(400).json({ error: error });
    }

    if (!emailAddress) {
        return res.status(404).json({ error: 'User has not been registered with an email address.' });
    }

    try {
        emailAddress = validation.validateEmailAddress(emailAddress);
    } catch (error) {
        return res.status(400).json({ error: error });
    }

    let time;

    try {
        time = validation.isValidTime24HourFormat(habitDocument.reminderTimeInput);
    } catch (error) {
        res.status(400).json({ error: error });
    }

    // Check to see if there is a user with the specified email address. If not, throw an error.

    try {
        await validation.checkIfEmailAddressExistsInDb(emailAddress);
    } catch (error) {
        res.status(404).json({ error: error });
    }

    const habitCollection = await habits();

    let habit = await habitCollection.findOne({ _id: new ObjectId(habitId) });

    if (!habit) {
        return res.status(404).json({ error: 'The habit you are trying to track could not be found' });
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
            console.log("I am in view all")
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
        } catch (e) {
            return res.status(400).json({ error: e });
        }

        try {
            const deletedHabit = await habitData.deleteHabit(deletionId);
            return res.json(deletedHabit);
        } catch (e) {
            return res.status(404).json({ error: e });
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

router
    .route('/log-habit/:habitid')
    .get(async (req, res) => {
        try {
            validation.checkOnlyId(req.params.habitid);
            let habitlist = await habitData.getHabitById(req.params.habitid);
            console.log("Tracked habits:", habitlist._id);
            return res.render('grouphabit', { title: 'Log Group/Individual Habits', habitname: habitlist.name, habitid: habitlist._id, habitscore: habitlist.weight });
        } catch (e) {
            return res.status(404).json({ error: e });
        }
    })
    .post(async (req, res) => {
        let isError = false;
        const habitDocument = req.body;

        if (!habitDocument || Object.keys(habitDocument).length === 0) {
            isError = true;
            return res
                .status(400)
                .render('protected', { title: 'Habit track Page', message: 'There are no fields in the request body.', isError: isError });
        }

        try {

            // Assuming that habitDocument.habitid is used to log habits based on the habitid parameter
            await habitLogData.postAllTrackedHabitsWithId(req.session.user.emailAddress, habitDocument.habitname, habitDocument.habitid, habitDocument.date, habitDocument.time, habitDocument.habitscore);

            console.log("habit id:", habitDocument.habitid);
        } catch (e) {
            return res
                .status(400)
                .render('protected', { title: 'Habit track Page', message: 'One or more inputs are incorrect.', error: e });
        }
        // Handle the success case
        res.redirect('/challenges'); // Redirect to a success page or handle it as needed
    });

router
    .route('/log-habit/individual/:habitid')
    .get(async (req, res) => {
        try {
            const habitId = validation.checkOnlyId(req.params.habitid);
            let habitlist = await habitData.getHabitById(habitId);
            return res.render('individualhabit', { title: 'Log Individual Habits', habitname: habitlist.name, habitid: habitlist._id, habitscore: habitlist.weight });
        } catch (e) {
            return res.status(404).json({ error: e });
        }
    })
    .post(async (req, res) => {
        let isError = false;
        const habitDocument = req.body;

        if (!habitDocument || Object.keys(habitDocument).length === 0) {
            isError = true;
            return res
                .status(400)
                .render('protected', { title: 'Individual Page', message: 'There are no fields in the request body.', isError: isError });
        }
        try {
            // Assuming that habitDocument.habitid is used to log habits based on the habitid parameter
            await habitLogData.postLogHabitsForIndividualChallenge(req.session.user.emailAddress, habitDocument.habitname, habitDocument.habitid, habitDocument.date, habitDocument.time, habitDocument.habitscore);

        } catch (e) {
            return res
                .status(400)
                .render('protected', { title: 'Individual Page', message: 'One or more inputs are incorrect.', error: e });
        }
        // Handle the success case
        res.redirect('/challenges'); // Redirect to a success page or handle it as needed
    });

export default router;