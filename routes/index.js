// This file will import both route files and export the constructor method as shown in the lecture code

/*
    - When the route is /events use the routes defined in the events.js routing file
    - When the route is /attendees use the routes defined in attendee.js routing file
    - All other enpoints should respond with a 404 as shown in the lecture code
*/
//Here you will import route files and export the constructor method as shown in lecture code and worked in previous labs.
import authRoutes from './auth_routes.js';
import habitRoutes from './habits.js';
import trackedHabitRoutes from './trackedHabits.js';
import path from 'path';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/habits', habitRoutes);
  app.use('/tracked-habits', trackedHabitRoutes);
 
  app.use('*', (req, res) => {
    res.sendStatus(404);
  });
};

export default constructorMethod;