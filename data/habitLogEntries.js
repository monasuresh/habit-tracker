import { ObjectId } from 'mongodb';
import { users } from '../config/mongoCollections.js';

const logHabit = async (emailAddress, trackedHabitID, date, time) => {
    let newId = new ObjectId();

    const newLogEntry = {
        _id: newId,
        trackedHabitID: new ObjectId(trackedHabitID),
        date: date,
        time: time
    }

    const userCollection = await users();

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { habitLog: newLogEntry } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    return { updatedTrackedHabits: true };
}

const getHabitLogEntryById = async (habitLogEntryId) => {
    const userCollection = await users();
    const habitLogEntry = await userCollection.findOne(
        { 'habitLog._id': new ObjectId(habitLogEntryId) },
        { projection: { _id: 0, 'habitLog.$': 1 } }
    );

    if (!habitLogEntry) {
        throw 'Could not find habit log entry for the provided id.';
    }

    return habitLogEntry.habitLog[0];
};

const getAllHabitLogEntries = async (emailAddress) => {
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