import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';

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
            let habitLogEntry = await habitLogData.getAllHabitLogEntries(emailAddress);
            return res.json(habitLogEntry);
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
            let habitEntry = await habitLogData.logHabit(req.session.user.emailAddress, habitDocument.habitNameInput, habitDocument.dateInput, habitDocument.timeInput);
            return res.json(habitEntry);
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

export default router;