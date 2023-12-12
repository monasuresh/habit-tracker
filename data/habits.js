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

    const habitCollection = await habits();

    validHabitParams.name = validHabitParams.name.toUpperCase();
    validHabitParams.effect = validHabitParams.effect.toLowerCase();

    await validation.checkForDuplicateHabitName(validHabitParams.name);

    // Create a new habit object
    const newHabit = {
        name: validHabitParams.name,
        effect: validHabitParams.effect,
        category: validHabitParams.category,
        weight: validHabitParams.weight
    };

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
    console.log("I am in get by id:",habitId);
    const habitCollection = await habits();
    const habit = await habitCollection.findOne({ _id: new ObjectId(habitId) });
    console.log(habit);
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

    const userCollection = await users();

    const habitCollection = await habits();

    let trackedHabits = await userCollection.find({ 'trackedHabits.habitId': new ObjectId(habitId) }, { projection: { _id: 0, 'trackedHabits.$': 1 } }).toArray();

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
    // Change to validate habitId string
    habitId = validation.validateIdStrings(habitId);
    let validHabitParams;

    if (habitInfo.nameInput) {
        validHabitParams = validation.validateHabitParams(habitInfo.nameInput, habitInfo.effectInput, habitInfo.categoryInput, habitInfo.weightInput, true);
    } else {
        validHabitParams = validation.validateHabitParams(habitInfo.name, habitInfo.effect, habitInfo.category, habitInfo.weight, true);
    }

    let updatedHabit = {}

    if (validHabitParams.name) {
        updatedHabit.name = validHabitParams.name.toUpperCase();
    }

    if (validHabitParams.effect) {
        updatedHabit.effect = validHabitParams.effect;
    }

    if (validHabitParams.category) {
        updatedHabit.category = validHabitParams.category;
    }

    if (validHabitParams.weight) {
        updatedHabit.weight = validHabitParams.weight;
    }

    const habitCollection = await habits();
    const updateInfo = await habitCollection.findOneAndUpdate(
        { _id: new ObjectId(habitId) },
        { $set: updatedHabit }
    );

    if (!updateInfo)
        throw 'Update failed, could not find the requested habit.';

    return updateInfo;
}

export default {
    createHabit,
    getHabitById,
    getAllHabits,
    deleteHabit,
    modifyHabit
};