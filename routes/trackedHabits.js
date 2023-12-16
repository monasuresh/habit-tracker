import { habitData } from '../data/index.js';
import express from 'express';
import { trackedHabitData } from '../data/index.js';
import { habitLogData } from '../data/index.js';
import validation from '../validation.js';
import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router
    .route('/get-all')
    .get(async (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({error: 'The user not authorized to view the content on this page.'});
        }

        let emailAddress = req.session.user.emailAddress;

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
        }

        let emailAddress;

        if (!req.session.user) {
            res.status(401).json({error: 'The user is not authorized to delete untrack the habit.'});
        } else {
            emailAddress = req.session.user.emailAddress;
        }

        if (!emailAddress) {
            res.status(400).json({error: 'The email address was not provided.'});
        }

        try {
            emailAddress = validation.validateEmailAddress(emailAddress);
        } catch (error) {
            res.status(400).json({error: error});
        }
    
        try {
            await validation.checkIfEmailAddressExistsInDb(emailAddress);
        } catch (error) {
            res.status(404).json({error: error});
        }
        
        const userCollection = await users();
    
        const userByTrackedHabitId = await userCollection.findOne({ 'emailAddress': emailAddress, 'trackedHabits._id': new ObjectId(habitToUntrackId) });
    
        if (!userByTrackedHabitId) {
            res.status(404).json({error: 'No tracked habit found for the provided id.'});
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