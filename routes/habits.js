import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';
import validation from '../validation.js';

const router = express.Router();

router
    .route('/create-habit')
    .get(async (req, res) => {
        try {
            return res.render('habits', { title: 'Create Habit' });
        } catch (e) {
            return res.status(500).render('error', { message: e });
        }
    })
    .post(async (req, res) => {
        //code here for POST
        console.log("I am in post create habit");
        const habitDocument = req.body;
        if (!habitDocument || Object.keys(habitDocument).length === 0) {
            return res
                .status(400)
                .json({ error: 'There are no fields in the request body' });
        }
        try {
            const newHabit = await habitData.createHabit(habitDocument.nameInput, habitDocument.effectInput, habitDocument.categoryInput, habitDocument.weightInput);
            return res.json(newHabit);
        } catch (e) {
            return res.status(500).json({ error: e });
        }
    });

router.route('/track/:habitId').post(async (req, res) => {
    let isError = false;
    const habitDocument = req.body;
    if (!habitDocument || Object.keys(habitDocument).length === 0) {
        isError = true;
        return res
            .status(400)
            .render('protected', { title: 'Welcome Page', message: 'There are no fields in the request body.', isError: isError });
    }

    try {
        const trackedHabit = await trackedHabitData.addTrackedHabit(req.session.user.emailAddress, req.params.habitId, req.body.reminderTimeInput);
        return res.json(trackedHabit);
    } catch (e) {
        return res.status(400).json({ error: e })
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
        try {
            //const deletedHabit = await eventData.remove(req.params.eventId);
            const deletedHabit = await habitData.deleteHabit(req.params.habitId);
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
            let trackedHabitsList = await trackedHabitData.getAllTrackedHabitsWithNames(emailAddress);
            return res.render('logHabits', { title: 'Log Habits', trackedHabitItems: trackedHabitsList });
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
                .render('protected', { title: 'Welcome Page', message: 'There are no fields in the request body.', isError: isError });
        }

        try {
            await habitLogData.logHabit(req.session.user.emailAddress, habitDocument.habitNameInput, habitDocument.dateInput, habitDocument.timeInput);
        } catch (e) {
            return res
                .status(400)
                .render('protected', { title: 'Welcome Page', message: 'One or more inputs are incorrect.', isError: isError });
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

        try {
            const updatedHabit = await habitData.modifyHabit(
                req.params.habitId,
                habitInfo
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

            //let habitlist = await habitData.getHabitById(habitDocument.habitid);

            //await habitLogData.postScore(req.session.user.emailAddress, habitlist.weight, habitlist.name)
            // Log the habit based on the habitid parameter
            // Adjust the arguments based on your logHabit function requirements
        } catch (e) {
            return res
                .status(400)
                .render('protected', { title: 'Habit track Page', message: 'One or more inputs are incorrect.', isError: isError });
        }
        // Handle the success case
        res.redirect('/success'); // Redirect to a success page or handle it as needed
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
                .render('protected', { title: 'Individual Page', message: 'One or more inputs are incorrect.', isError: isError });
        }
        // Handle the success case
        res.redirect('/success'); // Redirect to a success page or handle it as needed
    });

export default router;