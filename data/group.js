//import mongo collections, bcrypt and implement the following data functions
import { groups } from '../config/mongoCollections.js';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import habitData from '../data/habits.js';
import userData from '../data/users.js';
import bcrypt from 'bcrypt';

const exportedMethods = {

  async addGroups(groupname, habit, startdate, enddate, participate, userId) {
    //make sure to check that if user is already there with habit in existing group than don't add them
    console.log("I am in addgroups method")
    if (!groupname || !habit || !startdate || !enddate || !participate) {
      throw new Error('All the fields needs to be supplied');
    }
    const groupCollection = await groups();
    // Here check for if group is already exist
    console.log("I am in participate", participate)

    console.log("Outside");
    // Append req.session.user.id to the participate array
    //console.log(req.session.user);
    //const userId = req.session.user; // Replace with the actual field name
    if (!Array.isArray(participate)) {
      participate = [participate];
    }
    console.log("userID--------", userId);
    participate.push(userId);
    console.log(participate);
    console.log(".....................");
    const admin = userId;
    // Insert group into the database
    const newGroup = {
      groupname,
      admin,
      habit,
      startdate,
      enddate,
      score: 0,
      participate
    };
    console.log(newGroup);

    const insertInfo = await groupCollection.insertOne(newGroup);

    if (insertInfo.insertedCount === 0) {
      throw new Error('Error inserting group into the database.');
    }

    return { insertedGroup: true };
  },
  async getGroupById(id) {
    //id = validation.checkId(id);
    console.log("Id:", id);
    const groupCollection = await groups();
    console.log("Id----", id);
    //const group = await groupCollection.findOne({ _id: new ObjectId(id) });
    const group = await groupCollection.find({
      participate: {
        $elemMatch: { $eq: id }
      }
    }).toArray();
    console.log("Group list:", group);
    if (!group) throw 'Error: Group not found';

    return group;
  },

  async deleteGroup(groupId) {
    try {
      // 1. Find the habit IDs associated with the group
      const group = await this.getGroupById(groupId);

      if (!group || !group.habit) {
        throw new Error('Group not found or has no habits');
      }

      // 2. For each habit ID, find the corresponding habit name and user ID
      for (const habitId of group.habit) {
        const habit = await habitData.getHabitById(habitId);

        if (!habit || !habit.name) {
          throw new Error(`Habit not found for ID: ${habitId}`);
        }

        // 3. Delete the grouphabitlog entry for that habit name and user ID
        const userId = group.participate; // Assuming 'participate' contains user IDs

        if (userId) {
          // Adjust this to match your user data structure
          const user = await userData.getUserById(userId);

          if (user && user.grouphabitlog) {
            const habitIndex = user.grouphabitlog.findIndex(entry => entry.habitname === habit.name);

            if (habitIndex !== -1) {
              // Delete the entry from grouphabitlog
              user.grouphabitlog.splice(habitIndex, 1);
              // Save the updated user data
              await userData.updateUser(user.emailAddress, { grouphabitlog: user.grouphabitlog });
            }
          }
        }
      }

      return { deletedHabitLogs: true };
    } catch (error) {
      console.error('Error deleting habit logs:', error);
      return { error: 'Failed to delete habit logs' };
    }
  }
};


export default exportedMethods;