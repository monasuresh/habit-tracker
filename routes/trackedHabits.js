import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';

const router = express.Router();

router
    .route('/view-all')
    .get(async (req, res) => {
        try {
            const trackedHabitList = await trackedHabitData.getAllTrackedHabits(req.session.user.emailAddress);
            // get names for each tracked habit and set it for each tracked habit
            for (let trackedHabit of trackedHabitList) {
                let habit = await habitData.getHabitById(trackedHabit.habitId);
                trackedHabit['name'] = habit.name;
            }
            //const trackedHabitName = await trackedHabitData.getAllTrackedHabitsWithNames
            return res.render('viewAllTrackedhabits', { title: 'Tracked Habits', trackedHabitItems: trackedHabitList });
        } catch (e) {
            return res.status(500).send(e);
        }
    });

router
    .route('/delete/:trackedHabitId')
    .delete(async (req, res) => {
        try {
            await trackedHabitData.deleteTrackedHabit(req.session.user.emailAddress, req.params.trackedHabitId);
        } catch (e) {
            return res.status(404).send(e);
        }
    });

router
    .route('/view-habit-log')
    .get(async (req, res) => {
        try {
            return res.render('viewHabitLogs', { title: 'View Habit Logs'});
        } catch (e) {
            return res.status(500).send(e);
        }
    });

export default router;