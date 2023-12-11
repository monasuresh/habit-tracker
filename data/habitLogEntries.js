import { ObjectId } from 'mongodb';
import { users } from '../config/mongoCollections.js';
import { habits } from '../config/mongoCollections.js';
import validation from '../validation.js';

const logHabit = async (emailAddress, trackedHabitName, date, time) => {
    if (!emailAddress || !trackedHabitName || !date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof emailAddress !== 'string' || !validation.isEmailValid(emailAddress)) {
        throw 'The email address is invalid.';
    }

    emailAddress = emailAddress.trim();

    // Check to see if the email address exists in the database. If not, throw an error.

    date = validation.isValidHyphenSeparatedDate(date);

    time = validation.isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    //Checking to see if the current date/time combo is greater than the current time. If it is, it's invalid.

    /*if (!ObjectId.isValid(trackedHabitID)) {
        throw 'The provided tracked habit id is not a valid object Id.';
    } */

    // Get the habit ID

    const habitCollection = await habits();
    const userCollection = await users();

    let habit = await habitCollection.findOne({'name': trackedHabitName});
    let trackedHabit = await userCollection.findOne(
        { 'emailAddress': emailAddress, 'trackedHabits.habitId': habit._id },
        { projection: { _id: 0, 'trackedHabits.$': 1 } }
      );

    if (!trackedHabit || trackedHabit.trackedHabits.length === 0) {
        throw 'The provided habit has not yet been tracked.';
    }

    let newId = new ObjectId();

    const newLogEntry = {
        _id: newId,
        trackedHabitName: trackedHabitName,
        trackedHabitID: new ObjectId(trackedHabit.trackedHabits[0]._id),
        date: date,
        time: time
    }

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { habitLog: newLogEntry } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    let habitLogEntry = await getHabitLogEntryById(emailAddress, newId);

    return habitLogEntry;
}

const getHabitLogEntryById = async (emailAddress, habitLogEntryId) => {
    if (!emailAddress) {
        throw 'The user is not logged in.';
    }

    const userCollection = await users();
    const habitLogEntry = await userCollection.findOne(
        { 'emailAddress': emailAddress, 'habitLog._id': habitLogEntryId },
        { projection: { _id: 0, 'habitLog.$': 1 } }
    );

    if (!habitLogEntry || habitLogEntry.habitLog.length === 0) {
        throw 'Could not find habit log entry for the provided id.';
    }

    return habitLogEntry.habitLog[0];
};

const getAllHabitLogEntries = async (emailAddress) => {
    //Check to see if the email address is a valid string
    const userCollection = await users();
    const habitLogEntriesList = await userCollection.findOne({ 'emailAddress': emailAddress }, { projection: { _id: 0, habitLog: 1 } });
    if (!habitLogEntriesList) {
        throw 'Could not find habit log entries';
    }

    const habitLogEntries = habitLogEntriesList && habitLogEntriesList.habitLog ? habitLogEntriesList.habitLog : [];
    return habitLogEntries;
};

export default {
    logHabit,
    getAllHabitLogEntries,
    getHabitLogEntryById
};