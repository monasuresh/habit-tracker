import { habits } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const createHabit = async (
    name,
    effect,
    category,
    weight
) => {
    // Create a new user object
    const newHabit = {
        name: name,
        effect: effect,
        category: category,
        weight: weight
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

    const habitCollection = await habits();
    const habit = await habitCollection.findOne({ _id: habitId });
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
    if (!habitId) throw 'You must provide an id to search for';

    const habitCollection = await habits();
    const deletionInfo = await habitCollection.findOneAndDelete({
        _id: new ObjectId(habitId)
    });

    if (!deletionInfo) {
        throw `Could not delete habit with id of ${habitId}`;
    }

    return { habitName: deletionInfo.name, deleted: true };
};

const modifyHabit = async (habitId, habitInfo) => {
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