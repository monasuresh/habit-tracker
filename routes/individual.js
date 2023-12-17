//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import individualData from '../data/individual.js';
import validation from '../validation.js';

router.get('/', async (req, res) => {
  res.render('individual',{title:'Individual board'});
});

router.post('/', async (req, res) => {
  const { challengeNameInput, habitInput, startdateInput, enddateInput } = req.body;
  if (!req.body || Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ error: 'There are no fields in the request\'s body' });
  }
  try {
    const challengeName = validation.checkIndividualString(challengeNameInput);
    const habit = validation.checkOnlyId(habitInput);
    const individual = await individualData.addIndividual(challengeName, habit, startdateInput, enddateInput, req.session.user._id);

    if (individual.insertedGroup === true) {
      res.status(200).redirect('/challenges');
    }
  } catch (e) {
    res.status(400).render('individual', { error: e, challengeNameInput, habitInput, startdateInput, enddateInput });
  }
});

router
  .route('/delete-individual/:challengeId')
  .delete(async (req, res) => {
    try {
      const challengeId = validation.checkOnlyId(req.params.challengeId);
      const deletedChallenge = await individualData.deleteIndividualChallenge(challengeId);
      return res.json(deletedChallenge);
    } catch (e) {
      return res.status(404).json({ error: e });
    }
  });


export default router;