//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import individualData from '../data/individual.js';
import validation from '../validation.js';

router.get('/', async (req, res) => {
  res.render('individual');
});

// router.post('/', async (req, res) => {
//   //code here for POST
//   console.log("I am in post request");
//   const { groupname, habit, startdate, enddate, participate } = req.body;
//   console.log("I am in post groups")
//   try {
//     //Here do validation for each field

//     try {
//       const group = await groupData.addGroups(groupname, habit, startdate, enddate, participate);
//       if (group.insertedGroup === true) {
//         res.status(200).render('challenges', { message: 'You have successfully added group.' })
//       }

//     } catch (e) {
//       res.status(400).render('groups', { error: e, groupname: groupname, habit: habit, startdate: startdate, enddate: enddate, participate: participate });
//     }
//   }
//   catch (e) {
//     res.status(400).render('groups', { error: e });
//   }
// });

router.post('/', async (req, res) => {
  console.log("I am in post request");
  const { challengeNameInput, habitInput, startdateInput, enddateInput } = req.body;
  console.log("---------------------");
  console.log(req.body);

  try {
    const individual = await individualData.addIndividual(challengeNameInput, habitInput, startdateInput, enddateInput, req.session.user.id);

    if (individual.insertedGroup === true) {
      res.status(200).redirect('/challenges');
    }
  } catch (e) {
    res.status(400).render('individual', { error: e, challengeNameInput, habitInput, startdateInput, enddateInput });
  }
});


export default router;