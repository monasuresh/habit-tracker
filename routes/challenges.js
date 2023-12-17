//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import individualData from '../data/individual.js';
import habitData from '../data/habits.js';
import validation from '../validation.js';

router.get('/', async (req, res) => {
    try {
        if (!req.session.user._id) throw 'Id must be there in session';
        validation.checkOnlyId(req.session.user._id);
        const group = await groupData.getGroupByUserId(req.session.user._id);
        const individuals = await individualData.getIndividualByUserId(req.session.user._id);
        let habitDatalist = [];

        const userData = {
            id: req.session.user._id,
        };

        for (const entry of group) {
            try {
                const habitId = entry.habit;
                const habit = await habitData.getHabitById(habitId);
                habitDatalist.push(habit);
            } catch (error) {
                console.error("Error fetching habit:", error);
            }
        }
        for (const entry of individuals) {
            try {
                const habitId = entry.habit;
                const habit = await habitData.getHabitById(habitId);
                habitDatalist.push(habit);
            } catch (error) {
                console.error("Error fetching habit:", error);
            }
        }

        return res.status(200).render('challenges', { title: 'Challenges board', groupDataRet: group, individualDataRet: individuals, habitDataRet: habitDatalist, user: userData });
    } catch (e) {
        return res.status(404).json({ error: e });
    }
});
export default router;