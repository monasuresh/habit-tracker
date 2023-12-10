//import express, express router as shown in lecture code
import { Router } from 'express';
const router = Router();
import userData from '../data/users.js';
import validation from '../validation.js';
import { habitData } from '../data/index.js';
import { trackedHabitData } from '../data/index.js';

router.route('/').get(async (req, res) => {
  //code here for GET THIS ROUTE SHOULD NEVER FIRE BECAUSE OF MIDDLEWARE #1 IN SPECS.
  //return res.json({error: 'YOU SHOULD NOT BE HERE!'});
  //res.redirect('/login');
  res.redirect('/public/index.html')
});

router
  .route('/register')
  .get(async (req, res) => {
    res.render('register');
  })
  .post(async (req, res) => {
    //code here for POST
    let user = req.body;
    if (!user || Object.keys(user).length === 0) {
      return res
        .status(400)
        .json({ error: 'There are no fields in the request\'s body' });
    }
    try {
      const firstName = validation.validateString(user.firstName, 'First Name', 2, 25);
      const lastName = validation.validateString(user.lastName, 'Last Name', 2, 25);
      const emailAddress = user.emailAddress;
      if (!validation.isEmailValid(emailAddress)) {
        return res
          .status(400)
          .json({ error: 'Invalid email address provided' });
      }
      const userPassword = user.userPassword;
      if (!validation.validatePassword(userPassword)) {
        return res
          .status(400)
          .json({ error: 'Invalid password provided' });
      }
      const userRole = user.roles;

      try {
        const user = await userData.registerUser(firstName, lastName, emailAddress, userPassword, userRole);
        if (user.insertedUser === true) {
          //res.redirect('/login');
          res.status(200).render('login', { error: 'You have successfully registered. Use the credentials you just created to login', emailAddress: emailAddress })
        }

      } catch (e) {
        res.status(400).render('register', { error: e, firstName: firstName, lastName: lastName, emailAddress: emailAddress });
      }
    }
    catch (e) {
      res.status(400).render('register', { error: e });
    }
  });

router
  .route('/login')
  .get(async (req, res) => {
    res.render('login');
    //res.json({route: '/login', method: req.method});
  })
  .post(async (req, res) => {
    //code here for POST
    //console.log('Login POST');
    let user = req.body;
    if (!user || Object.keys(user).length === 0) {
      return res
        .status(400)
        .json({ error: 'There are no fields in the request\'s body' });
    }
    try {
      const emailAddress = user.emailAddress;
      //console.log('Login POST - email: '+emailAddress);
      if (!validation.isEmailValid(emailAddress)) {
        return res
          .status(400)
          .json({ error: 'Invalid email address provided' });
      }
      const userPassword = user.userPassword;
      if (!validation.validatePassword(userPassword)) {
        return res
          .status(400)
          .json({ error: 'Invalid password provided' });
      }
      //console.log('Login POST - Password: '+userPassword);
      try {
        const user = await userData.loginUser(emailAddress, userPassword);
        //console.log('Login POST - user: '+user.emailAddress);
        if (user.emailAddress === emailAddress) {
          //console.log('Login POST - email: '+emailAddress+' MATCHES!!!');
          req.session.user = { id: user._id, firstName: user.firstName, lastName: user.lastName, emailAddress: user.emailAddress, role: user.role };
          if (user.role === "admin") {
            res.redirect('/admin');
          } else {
            res.redirect('/protected');
          }
        }
      } catch (e) {
        res.status(400).render('login', { error: e, emailAddress: emailAddress, userPassword: userPassword });
      }
    }
    catch (e) {
      res.status(400).render('login', { error: e, emailAddress: emailAddress, userPassword: userPassword });
    }
  });

/*router.route('/protected').get(async (req, res) => {
  var currentdate = new Date();
  var currentTime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
  res.render('protected',{firstName: req.session.user.firstName, lastName: req.session.user.lastName, currentTime: currentTime, role: req.session.user.role});
}); */

router.route('/protected').get(async (req, res) => {
  try {
    const currentTime = new Date();
    let isAdmin = req.session.user.role === 'admin';
    const habitItems = await habitData.getAllHabits();
    return res.render('protected', { title: 'User Page', firstName: req.session.user.firstName, lastName: req.session.user.lastName, currentTime: currentTime, role: req.session.user.role, isAdmin: isAdmin, habitItems: habitItems });
  } catch (e) {
    return res.status(500).render('error', { message: 'Internal Server Error' });
  }
});

router.route('/protected').post(async (req, res) => {
  let isError = false;
  const habitDocument = req.body;
  if (!habitDocument || Object.keys(habitDocument).length === 0) {
    isError = true;
    return res
      .status(400)
      .render('protected', { title: 'Welcome Page', message: 'There are no fields in the request body.', isError: isError });
  }

  try {
    let habit = habitDocument['habits'];
    for (let trackedHabitKey in habit) {
      let specificHabit = habit[trackedHabitKey];
      console.log(specificHabit.trackedHabitCheckBoxInput);
      await trackedHabitData.addTrackedHabit(req.session.user.emailAddress, specificHabit.trackedHabitCheckBoxInput, specificHabit.reminderTimeInput);
    }
  } catch (e) {
    return res
      .status(400)
      .render('protected', { title: 'Welcome Page', message: 'One or more inputs are incorrect.', isError: isError });
  }
});

router.route('/admin').get(async (req, res) => {
  var currentdate = new Date();
  var currentTime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
  res.render('admin', { firstName: req.session.user.firstName, lastName: req.session.user.lastName, currentTime: currentTime });
});

router.route('/error').get(async (req, res) => {
  res.render('error');
});

router.route('/logout').get(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      // Handle the error, e.g., redirect to an error page
      res.status(500).render('error', { message: 'Internal Server Error' });
    } else {
      // Redirect to the root route after successfully destroying the session
      res.render('logout');
    }
  });

});

export default router;