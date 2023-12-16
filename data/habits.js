import { habits } from '../config/mongoCollections.js';
import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';

const createHabit = async (
    name,
    effect,
    category,
    weight
) => {
    let validHabitParams = validation.validateHabitParams(name, effect, category, weight, false);

    // Create a new habit object
    const newHabit = {
        name: validHabitParams.name,
        effect: validHabitParams.effect,
        category: validHabitParams.category,
        weight: validHabitParams.weight
    };

    const habitCollection = await habits();

    const insertInfo = await habitCollection.insertOne(newHabit);

    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add habit';

    const newId = insertInfo.insertedId;

    const habit = await getHabitById(newId);
    return habit;
};

const getHabitById = async (habitId) => {

    if (!habitId) throw 'You must provide an id to search for';
    if (!ObjectId.isValid(habitId)) {
        throw 'The habit id is not a valid ObjectId.';
    }
    const habitCollection = await habits();
    const habit = await habitCollection.findOne({ _id: new ObjectId(habitId) });
    if (!habit) throw 'No habit with that id';
    return habit;
};

const getAllHabits = async () => {
    const habitCollection = await habits();
    const habitList = await habitCollection.find({}).toArray();

    if (!habitList) throw 'Could not get all habits';

    return habitList;
};

const deleteHabit = async (habitId) => {
    habitId = validation.validateIdStrings(habitId);
    /*emailAddress = validation.validateEmailAddress(emailAddress); */

    // Checking to see if the email address can be found in the database

    const userCollection = await users();

    //let foundEmailAddress = await userCollection.find({'emailAddress': emailAddress}, { projection: {_id: 0, 'emailAddress': 1}});

    /*let foundEmailAddress = await userCollection.find({ 'emailAddress': emailAddress }, { projection: { _id: 0, 'emailAddress': 1 } }).toArray();

    if (foundEmailAddress.length === 0) {
        throw 'Either the user is not logged in or the email address could not be found in the database.';
    } */

    const habitCollection = await habits();

    let trackedHabits = await userCollection.find({ 'trackedHabits.habitId': new ObjectId(habitId) }, { projection: { _id: 0, 'trackedHabits.$': 1 } }).toArray();

    /*if (trackedHabits.length === 0) {
        throw 'Could not find a tracked habit associated with that id';
    } */

    for (const trackedHabit of trackedHabits) {
        await userCollection.updateMany(
            {},
            {
                $pull: {
                    habitLog: {
                        'trackedHabitID': trackedHabit.trackedHabits[0]._id
                    }
                }
            }
        );
    }

    // Update user document to remove tracked habits with habitId
    await userCollection.updateMany(
        {},
        { $pull: { trackedHabits: { 'habitId': new ObjectId(habitId) } } }
    );

    // Delete the actual habit
    const deletionInfo = await habitCollection.findOneAndDelete({
        _id: new ObjectId(habitId)
    });

    if (!deletionInfo) {
        throw `Could not delete habit with id of ${habitId}`;
    }

    return { habitName: deletionInfo.name, deleted: true };
};

const modifyHabit = async (habitId, habitInfo) => {
    let validHabitParams = validation.validateHabitParams(habitInfo.nameInput, habitInfo.effectInput, habitInfo.categoryInput, habitInfo.weightInput, true);
    if (!habitId) throw 'You must provide an id to search for';

    let updatedHabit = {}

    if (habitInfo.nameInput) {
        updatedHabit.name = habitInfo.nameInput
    }

    if (habitInfo.effectInput) {
        updatedHabit.effect = habitInfo.effectInput
    }

    if (habitInfo.categoryInput) {
        updatedHabit.category = habitInfo.categoryInput
    }

    if (habitInfo.categoryInput) {
        updatedHabit.category = habitInfo.categoryInput
    }

    if (habitInfo.weightInput) {
        updatedHabit.weight = habitInfo.weightInput
    }

    const habitCollection = await habits();
    const updateInfo = await habitCollection.findOneAndUpdate(
        { _id: new ObjectId(habitId) },
        { $set: updatedHabit }
    );

    if (!updateInfo)
        throw `Error: Update failed, could not find a user with id of ${id}`;

    return updateInfo;
}

export default {
    createHabit,
    getHabitById,
    getAllHabits,
    deleteHabit,
    modifyHabit
};