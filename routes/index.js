// This file will import both route files and export the constructor method as shown in the lecture code

/*
    - When the route is /events use the routes defined in the events.js routing file
    - When the route is /attendees use the routes defined in attendee.js routing file
    - All other enpoints should respond with a 404 as shown in the lecture code
*/
//Here you will import route files and export the constructor method as shown in lecture code and worked in previous labs.
import authRoutes from './auth_routes.js';
import groupRoutes from './groups.js';
import userRoutes from './users.js';
import challangeRoutes from './challenges.js';
import individualRoutes from './individual.js';
import habitRoutes from './habits.js';
import trackedHabitRoutes from './trackedHabits.js';
import leadershipRoutes from './leadershipboard.js';
import path from 'path';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  console.log("I am in index route")
  app.use('/groups', groupRoutes);
  console.log("I am going in groups")
  app.use('/users', userRoutes);
  app.use('/challenges', challangeRoutes);
  app.use('/individual', individualRoutes);
  app.use('/leadershipboard',leadershipRoutes);
  app.use('/habits', habitRoutes);
  app.use('/tracked-habits', trackedHabitRoutes);

  app.use('*', (req, res) => {
    console.log("404 calling")
    console.log(`[${new Date().toUTCString()}]: ${req.method} ${req.originalUrl} - Not Found`);
    res.sendStatus(404);
  });
};

export default constructorMethod;