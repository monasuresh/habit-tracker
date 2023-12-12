//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import validation from '../validation.js';

console.log("I am in main")
router.get('/', async (req, res) => {
  console.log("I am in get groups")
  res.render('groups');
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
  const { groupNameInput, habitInput, startdateInput, enddateInput, userInput } = req.body;
  console.log("---------------------");
  console.log(req.body);

  try {
    console.log("Login data:------", req.session.user.id)
    //userId = req.session.user._id
    //console.log("hiiii user:", userId)
    const group = await groupData.addGroups(groupNameInput, habitInput, startdateInput, enddateInput, userInput, req.session.user.id);


    if (group.insertedGroup === true) {
      console.log("Inserted!!!!!!!!!");
      res.status(200).redirect('/challenges');
    }
  } catch (e) {
    res.status(400).render('groups', { error: e, groupNameInput, habitInput, startdateInput, enddateInput, userInput });
  }
});

router
    .route('/delete-group/:groupId')
    .delete(async (req, res) => {
        try {
            const deletedGroup = await groupData.deleteGroup(req.params.groupId);
            return res.json(deletedGroup);
        } catch (e) {
            return res.status(404).json({ error: e });
        }
});


export default router;