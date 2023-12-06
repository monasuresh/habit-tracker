import { ObjectId } from 'mongodb';
import { habits } from '../config/mongoCollections.js';
import { users } from '../config/mongoCollections.js';

const addTrackedHabit = async (emailAddress, habitId, name, reminderTime) => {
    let newId = new ObjectId();

    const newTrackedHabit = {
        _id: newId,
        habitId: new ObjectId(habitId),
        name: name
    }

    const userCollection = await users();

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { trackedHabits: newTrackedHabit } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    return { updatedTrackedHabits: true };
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

export default {
    addTrackedHabit,
    getAllTrackedHabits,
    getAllTrackedHabitsWithNames,
    getTrackedHabitById
};