import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';

const router = express.Router();

router
    .route('/get-all')
    .get(async (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({error: 'The user not authorized to view the content on this page.'});
        }

        let emailAddress = req.session.user.emailAddress;

        /*if (!emailAddress) {
            return res.status(400).
        } */
        try {
            const trackedHabitList = await trackedHabitData.getAllTrackedHabits(emailAddress);
            return res.json(trackedHabitList);
        } catch (e) {
            return res.status(500).send(e);
        }
    });

router
    .route('/delete/:trackedHabitId')
    .delete(async (req, res) => {
        let habitToUntrackId = req.params.trackedHabitId;
        if (!habitToUntrackId || habitToUntrackId === 'undefined') {
            return res.status(404).json({error: 'Not Found: The habit to untrack is not yet tracked.'});
            //return res.status(404).render('habits', { errorMessage: "Not Found: The habit to untrack is not yet tracked.", isError: isError });
        }

        try {
            await trackedHabitData.deleteTrackedHabit(req.session.user.emailAddress, req.params.trackedHabitId);
        } catch (e) {
            return res.status(404).json({error: e});;
        }
    });

router
    .route('/view-habit-log')
    .get(async (req, res) => {
        try {
            return res.render('viewHabitLogs', { title: 'Habit Log' });
        } catch (e) {
            return res.status(500).send(e);
        }
    });

export default router;