import { ObjectId } from 'mongodb';
import { users } from '../config/mongoCollections.js';
import { habits } from '../config/mongoCollections.js';
import validation from '../validation.js';

const logHabit = async (emailAddress, trackedHabitName, date, time) => {
    if (!emailAddress || !trackedHabitName || !date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof trackedHabitName !== 'string') {
        throw 'The tracked habit name must be of type string';
    }

    trackedHabitName = trackedHabitName.trim();

    if (trackedHabitName.length === 0) {
        throw 'The tracked habit name must not be a string with just empty spaces.';
    }

    trackedHabitName = trackedHabitName.toUpperCase();

    emailAddress = validation.validateEmailAddress(emailAddress);

    date = validation.isValidHyphenSeparatedDate(date);

    time = validation.isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    // Check to see if there is a user with the specified email address. If not, throw an error.

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

    const habitCollection = await habits();
    const userCollection = await users();

    let habit = await habitCollection.findOne({ 'name': trackedHabitName });

    if (!habit) {
        throw 'No habit exists for the provided tracked habit name.';
    }

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
        trackedHabitName: trackedHabitName.toUpperCase(),
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
    emailAddress = validation.validateEmailAddress(emailAddress);

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

    if (!habitLogEntryId) {
        throw 'You must provide an id to search for.';
    }

    if (!ObjectId.isValid(habitLogEntryId)) {
        throw 'Invalid id.';
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
    emailAddress = validation.validateEmailAddress(emailAddress);

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

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