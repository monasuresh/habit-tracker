//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import individualData from '../data/individual.js';
import habitData from '../data/habits.js';
import validation from '../validation.js';

console.log("I am in main")
router.get('/', async (req, res) => {
    // try {
    //     console.log("Challange user id:",req.session.user)
    //     //req.session.user.id = validation.checkId(req.params.id, 'Id URL Param');
    // } catch (e) {
    //     return res.status(400).json({ error: e });
    // }
    //try getting the group by ID
    try {
        console.log("Group session id", req.session.user.id)
        const group = await groupData.getGroupById(req.session.user.id);
        const individuals = await individualData.getIndividualById(req.session.user.id);
        let habitDatalist = [];

        const userData = {
            id: req.session.user.id,
        };

        for (const entry of group) {
            try {
                const habitId = entry.habit;
                console.log(habitId);
                const habit = await habitData.getHabitById(habitId);
                console.log("Data:", habit);
                habitDatalist.push(habit);
            } catch (error) {
                console.error("Error fetching habit:", error);
            }
        }
        for (const entry of individuals) {
            try {
                const habitId = entry.habit;
                console.log(habitId);
                const habit = await habitData.getHabitById(habitId);
                console.log("Data:", habit);
                habitDatalist.push(habit);
            } catch (error) {
                console.error("Error fetching habit:", error);
            }
        }
        console.log("Group:", group);
        console.log("UserData:",userData);
        //console.log(group.habit);
        //const habit = await habitData.getHabitById(group.habit);
        console.log("Data:", habitDatalist);
        return res.status(200).render('challenges', { groupDataRet: group, individualDataRet: individuals, habitDataRet: habitDatalist, user: userData });
    } catch (e) {
        return res.status(404).json({ error: e });
    }
    // res.render('challenges', { firstName: req.session.user.firstName, lastName: req.session.user.lastName });
});
export default router;