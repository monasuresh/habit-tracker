# Habit Tracker

## Description
Habit Tracker is a web application designed to help users track and manage their habits effectively. Whether it's a good habit you're trying to cultivate or a bad habit you're trying to break, this app is the perfect tool for you.

## Version
1.0.0

## Features
- Track daily habits
- Identify good and bad habits
- Set reminders for habits
- View habit streaks and progress
- Secure user authentication

## Installation
To set up the Habit Tracker app on your local machine, follow these steps:

1. Clone the repository:

   ```bash
   git clone [repository-url]

2. Navigate to the project directory:

    cd habit-tracker

3. Install dependencies:
    
    npm install

4. Start the server:

    npm start
    
The application will be running at http://localhost:3000.

5. Database:

The dump of the mongodb database can be found in the dump folder. You may use this to seed the database by running mongorestore /dump under the project directory.


## Usage
After starting the server, navigate to http://localhost:3000 on your web browser to access the Habit Tracker application. Register for a new account or log in to start tracking your habits.

## Built With
Node.js
Express
MongoDB
Express-Handlebars
Bcrypt for user authentication
Date-fns and Moment for date manipulation
Authors
Group 3: Komal, Mit, Monica, Nitin
License
This project is licensed under the ISC License.


## Authors

Group 3: Komal, Mit, Monica, Nitin


## Dependencies

- bcrypt ^5.1.1: For user password encryption.
- date-fns ^2.30.0: For date manipulation.
- express ^4.18.2: For server-side logic.
- express-handlebars ^7.1.2: For rendering views.
- express-session ^1.17.3: For managing user sessions.
- moment ^2.29.4: For date formatting and manipulation.
- mongodb ^6.3.0: For database interactions.
- nodemon ^3.0.2: For automatic server restarts during development.
