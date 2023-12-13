import { ObjectId } from 'mongodb';
import { habits } from '../config/mongoCollections.js';
import { users } from '../config/mongoCollections.js';

const addTrackedHabit = async (emailAddress, habitId, reminderTime) => {
    let newId = new ObjectId();

    const newTrackedHabit = {
        _id: newId,
        habitId: new ObjectId(habitId),
        reminderTime: reminderTime
    }

    const userCollection = await users();

    let existingTrackedHabit = await userCollection.findOne(
        {
            'emailAddress': emailAddress,
            'trackedHabits.habitId': new ObjectId(habitId)
        },
        {
            projection:
            {
                _id: 0, trackedHabits: 1
            }
        }
    );

    if (existingTrackedHabit) {
        throw 'The habit has already been tracked.';
    }

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { trackedHabits: newTrackedHabit } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    let updatedTrackedHabit = await getTrackedHabitById(newId.toString());

    return updatedTrackedHabit;
};

const getAllTrackedHabits = async (emailAddress) => {
    const userCollection = await users();
    const trackedHabitsList = await userCollection.findOne({ 'emailAddress': emailAddress }, { projection: { _id: 0, trackedHabits: 1 } });
    if (!trackedHabitsList) {
        throw 'Could not find any tracked habits.';
    }

    const trackedHabits = trackedHabitsList && trackedHabitsList.trackedHabits ? trackedHabitsList.trackedHabits : [];
    return trackedHabits;
};

const getTrackedHabitById = async (trackedHabitId) => {
    const userCollection = await users();
    const trackedHabit = await userCollection.findOne(
        { 'trackedHabits._id': new ObjectId(trackedHabitId) },
        { projection: { _id: 0, 'trackedHabits.$': 1 } }
    );

    if (!trackedHabit) {
        throw 'Could not find tracked habit for the provided id.';
    }

    return trackedHabit.trackedHabits[0];
};

const getAllTrackedHabitsWithNames = async (emailAddress) => {
    if (!emailAddress) {
        throw 'An email Address was not provided so the tracked habits with names could not be fetched.';
    }

    const trackedHabits = await getAllTrackedHabits(emailAddress);

    let habitObject = {};

    const habitCollection = await habits();

    if (trackedHabits.length > 0) {
        for (let trackedHabit of trackedHabits) {
            let habitId = trackedHabit.habitId;
            let globalHabitName = await habitCollection.findOne({ _id: habitId }, { projection: { _id: 0, name: 1 } });

            if (!globalHabitName) {
                throw 'There is no globally available habit associated with the tracked habit.';
            }

            habitObject[globalHabitName.name] = trackedHabit;
        }
    }


    return habitObject;
};

const deleteTrackedHabit = async (emailAddress, trackedHabitID) => {
    const userCollection = await users();

    const userByTrackedHabitId = await userCollection.findOne({ 'emailAddress': emailAddress, 'trackedHabits._id': new ObjectId(trackedHabitID) });

    if (!userByTrackedHabitId) {
        throw 'No tracked habit found for the provided id.';
    }

    let deletedTrackedHabit = await userCollection.updateOne({ 'emailAddress': emailAddress, 'trackedHabits._id': new ObjectId(trackedHabitID) }, { $pull: { trackedHabits: { _id: new ObjectId(trackedHabitID) } } });

    if (!deletedTrackedHabit) {
        throw 'Could not delete the tracked habit.';
    }

    return { deletedTrackedHabit: true };
}

export default {
    addTrackedHabit,
    getAllTrackedHabits,
    getAllTrackedHabitsWithNames,
    getTrackedHabitById,
    deleteTrackedHabit
};