//import mongo collections, bcrypt and implement the following data functions
import { individual, users, habits } from '../config/mongoCollections.js';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import bcrypt from 'bcrypt';
import habitData from '../data/habits.js';
import userData from '../data/users.js';

const exportedMethods = {

  async addIndividual(challengename, habit, startdate, enddate, userId) {
    if (!challengename || !habit || !startdate || !enddate || !userId) {
      throw new Error('All the fields needs to be supplied');
    }
    validation.checkIndividualString(challengename);
    const individualCollection = await individual();
    const habitCollection = await habits();
    const userCollection = await users();

    const existingIndividual = await individualCollection.findOne({ 'challengename': challengename })
    if (existingIndividual) throw 'The individual challenge is already exist with this name';
    const existingHabit = await habitCollection.findOne({ '_id': new ObjectId(habit) })
    const existingUser = await userCollection.findOne({ '_id': new ObjectId(userId) })

    if (userId && existingUser.individualhabitlog) {
      const habitIndex = existingUser.individualhabitlog.findIndex(entry => entry.habitname === existingHabit.name);
      console.log(habitIndex);
      if (habitIndex > -1) throw 'You are already part of this habit for one of the individual challenge'
    }
    if (userId === existingUser.userId) throw 'User already exist in challenge';
    const startDate = new Date(startdate);
    const today = new Date();

    if (startDate > today) throw 'You must choose startdate today/future date';
    if (startdate > enddate) throw 'Startdate should be less than enddate';
    const newstartdate = new Date(startdate);
    const newenddate = new Date(enddate);
    const timeDifference = newenddate - newstartdate;

    // Calculate the difference in days
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    // Check if the difference is at least 7 days
    if (daysDifference < 7) throw 'The challenge should be taken for atleast 7 days';

    // Insert individual into the database
    const newIndividual = {
      challengename,
      habit,
      startdate,
      enddate,
      score: 0,
      userId
    };
    const insertInfo = await individualCollection.insertOne(newIndividual);

    if (insertInfo.insertedCount === 0) {
      throw new Error('Error inserting individual challenge into the database.');
    }

    return { insertedGroup: true };
  },

  async getIndividualByUserId(id) {
    validation.checkOnlyId(id);
    const individualCollection = await individual();
    const individuals = await individualCollection.find({ userId: id }).toArray();
    if (!individuals) throw 'Error: User not found';

    return individuals;
  },

  async getIndividualById(id) {
    validation.checkOnlyId(id);
    const individualCollection = await individual();
    const individuals = await individualCollection.findOne({ _id: new ObjectId(id) });
    console.log("Individual list:", individuals);
    if (!individuals) throw 'Error: Individual not found';

    return individuals;
  },

  async deleteIndividualChallenge(challengeId) {
    try {
      if (!challengeId) throw 'Challenge Id must be provided';
      const individuals = await this.getIndividualById(challengeId);

      if (!individuals || !individuals.habit) {
        throw new Error('Individual not found or has no habits');
      }

      const habit = await habitData.getHabitById(individuals.habit);

      if (!habit || !habit.name) {
        throw new Error(`Habit not found for ID: ${habitId}`);
      }

      const userCollection = await users();
      const individualCollection = await individual();

      const userInfo = await userData.getUserById(individuals.userId);

      if (userInfo) {

        if (userInfo && userInfo.individualhabitlog && Array.isArray(userInfo.individualhabitlog)) {
          const habitIndex = userInfo.individualhabitlog.findIndex(entry => entry.habitname === habit.name);

          if (habitIndex !== -1) {
            userInfo.individualhabitlog.splice(habitIndex, 1);

            const updateInfo = await userCollection.findOneAndUpdate(
              { _id: new ObjectId(userInfo._id) },
              { $set: { 'individualhabitlog': userInfo.individualhabitlog } }
            );
            if (!updateInfo) throw `Error: Update failed, could not find a user with id of ${_id}`;
          }
        } else {
          console.error("Invalid user or individualhabitlog structure:", userInfo);
        }
      }
      const result = await individualCollection.deleteOne({ _id: new ObjectId(challengeId) });

      if (result.deletedCount === 0) {
        throw new Error('Failed to delete individual challenge');
      }

      return { deletedIndidualChallengeAndHabitLogs: true };
    } catch (error) {
      console.error('Error deleting habit logs:', error);
      return { error: 'Failed to delete habit logs' };
    }
  }
};

export default exportedMethods;