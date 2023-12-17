//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import groupData from '../data/group.js';
import validation from '../validation.js';

router.get('/', async (req, res) => {
  res.render('groups', { title: 'Group board' });
});

router.post('/', async (req, res) => {
  const { groupNameInput, habitInput, startdateInput, enddateInput, userInput } = req.body;
  if (!req.body || Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ error: 'There are no fields in the request\'s body' });
  }
  if (!groupNameInput || !habitInput || !startdateInput || !enddateInput || !userInput) throw 'All fields needs to be supplied';

  try {
    const groupName = validation.checkGroupString(groupNameInput);
    const habit = validation.checkOnlyId(habitInput);
    const group = await groupData.addGroups(groupName, habit, startdateInput, enddateInput, userInput, req.session.user.id);

    if (group.insertedGroup === true) {
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
      validation.checkOnlyId(req.params.groupId);
      const deletedGroup = await groupData.deleteGroup(req.params.groupId);
      return res.json(deletedGroup);
    } catch (e) {
      return res.status(404).json({ error: e });
    }
  });

router
  .route('/add-user/:selectedUserId')
  .post(async (req, res) => {
    const { userId, groupId } = req.body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: 'There are no fields in the request\'s body' });
    }
    try {
      const group = await groupData.updateGroups(userId, groupId);
      if (group.insertedGroup === true) {
        res.status(200).redirect('/challenges');
      }
    } catch (e) {
      res.status(400).render('challenges', { error: e });
    }
  });

router
  .route('/delete-user/:groupId/:userId')
  .delete(async (req, res) => {
    try {
      const groupId = validation.checkOnlyId(req.params.groupId);
      const userId = validation.checkOnlyId(req.params.userId);
      const deletedUser = await groupData.deleteUser(groupId, userId);
      return res.json(deletedUser);
    } catch (e) {
      return res.status(404).json({ error: e });
    }
  });

router.get('/groups-all', async (req, res) => {
  try {
    // Fetch user data from the database
    const groupUser = await groupData.getGroupUserData();
    return res.json(groupUser);

  } catch (e) {
    res.status(500).json({ error: e });
  }
});


export default router;