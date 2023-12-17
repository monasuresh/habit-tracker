//import mongo collections, bcrypt and implement the following data functions
import { groups, users, habits } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import habitData from '../data/habits.js';
import userData from '../data/users.js';
import bcrypt from 'bcrypt';

const exportedMethods = {

  async addGroups(groupname, habit, startdate, enddate, participate, userId) {

    console.log("addGroups",groupname, habit, startdate, enddate, participate, userId)
    if (!groupname || !habit || !startdate || !enddate || !participate || !userId) {
      throw new Error('All the fields needs to be supplied');
    }
    validation.checkGroupString(groupname);
    const groupCollection = await groups();
    const habitCollection = await habits();
    const userCollection = await users();
    // Here check for if group is already exist
    const existingGroup = await groupCollection.findOne({ 'groupname': groupname })
    if (existingGroup) throw 'The group is already exist with this name';
    const existingHabit = await habitCollection.findOne({ '_id': new ObjectId(habit) })
    const existingUser = await userCollection.findOne({ '_id': new ObjectId(userId) })

    if (userId && existingUser.grouphabitlog) {
      const habitIndex = existingUser.grouphabitlog.findIndex(entry => entry.habitname === existingHabit.name);
      if (habitIndex > -1) throw 'You are already part of this habit for one of the group'
    }
    if (!Array.isArray(participate)) {
      participate = [participate];
    }
    if (participate.includes(userId)) throw 'User already exist in group or owner of the group';
    if (startdate > enddate) throw 'Startdate should be less than enddate';
    const newstartdate = new Date(startdate);
    const newenddate = new Date(enddate);
    const timeDifference = newenddate - newstartdate;

    // Calculate the difference in days
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    // Check if the difference is at least 7 days
    if (daysDifference < 7) throw 'The challenge should be taken for atleast 7 days';

    participate.push(userId);

    const admin = userId;
    const newGroup = {
      groupname,
      admin,
      habit,
      startdate,
      enddate,
      score: 0,
      participate
    };

    const insertInfo = await groupCollection.insertOne(newGroup);

    if (insertInfo.insertedCount === 0) {
      throw new Error('Error inserting group into the database.');
    }

    return { insertedGroup: true };
  },

  async getGroupByUserId(id) {
    if (!id) throw 'User Id must be provide!';
    validation.checkOnlyId(id);
    const groupCollection = await groups();
    const group = await groupCollection.find({
      participate: {
        $elemMatch: { $eq: id }
      }
    }).toArray();
    if (!group) throw 'Error: Group not found';
    return group;
  },

  async getGroupById(id) {
    if (!id) throw 'Group id must be provide!';
    validation.checkOnlyId(id);
    const groupCollection = await groups();
    const group = await groupCollection.findOne({ _id: new ObjectId(id) });
    if (!group) throw 'Error: Group not found';

    return group;
  },

  async deleteGroup(groupId) {
    try {
      if (!groupId) throw 'Group Id must be provide!'
      validation.checkOnlyId(groupId);
      const group = await this.getGroupById(groupId);
      if (!group || !group.habit) {
        throw new Error('Group not found or has no habits');
      }
      const habit = await habitData.getHabitById(group.habit);

      if (!habit || !habit.name) {
        throw new Error(`Habit not found for ID: ${habitId}`);
      }

      const userIds = group.participate;

      const matchUsers = [];

      const userCollection = await users();
      const groupCollection = await groups();

      for (const userId of userIds) {
        const userList = await userData.getUserById(userId);
        matchUsers.push(userList);
      }
      for (const user of matchUsers) {

        if (user && user.grouphabitlog && Array.isArray(user.grouphabitlog)) {
          const habitIndex = user.grouphabitlog.findIndex(entry => entry.habitname === habit.name);

          if (habitIndex !== -1) {
            user.grouphabitlog.splice(habitIndex, 1);

            const updateInfo = await userCollection.findOneAndUpdate(
              { _id: new ObjectId(user._id) },
              { $set: { 'grouphabitlog': user.grouphabitlog } }
            );
            if (!updateInfo) throw `Error: Update failed, could not find a user with id of ${_id}`;
          }
        } else {
          console.error("Invalid user or grouphabitlog structure:", user);
        }
      }
      const result = await groupCollection.deleteOne({ _id: new ObjectId(groupId) });

      if (result.deletedCount === 0) {
        throw new Error('Failed to delete group');
      }

      return { deletedGroupAndHabitLogs: true };
    } catch (error) {
      console.error('Error deleting habit logs:', error);
      return { error: 'Failed to delete habit logs' };
    }
  },

  async updateGroups(id, groupid) {
    if (!id || !groupid) throw 'Id and Group Id must be supplied';
    validation.checkOnlyId(id);
    validation.checkOnlyId(groupid);
    const groupCollection = await groups();
    const group = await groupCollection.findOneAndUpdate({ _id: new ObjectId(groupid) }, { $push: { participate: id } });
    if (!group) throw 'Error: Group not found';
    return { updateUserId: true };
  },

  async deleteUser(groupId, userId) {
    try {
      if (!groupId || !userId) throw 'Group Id and User Id must be supplied!';
      validation.checkOnlyId(groupId);
      validation.checkOnlyId(userId);
      const group = await this.getGroupById(groupId);

      if (!group || !group.habit) {
        throw new Error('Group not found or has no habits');
      }

      const habit = await habitData.getHabitById(group.habit);

      if (!habit || !habit.name) {
        throw new Error(`Habit not found for ID: ${habitId}`);
      }

      const userCollection = await users();
      const groupCollection = await groups();

      const user = group.participate.includes(userId);
      if (user) {
        const userInfo = await userCollection.findOne({ _id: new ObjectId(userId) })
        if (userInfo && userInfo.grouphabitlog && Array.isArray(userInfo.grouphabitlog)) {
          const habitIndex = userInfo.grouphabitlog.findIndex(entry => entry.habitname === habit.name);

          if (habitIndex !== -1) {
            userInfo.grouphabitlog.splice(habitIndex, 1);
            const updateInfo = await userCollection.findOneAndUpdate(
              { _id: new ObjectId(userInfo._id) },
              { $set: { 'grouphabitlog': userInfo.grouphabitlog } }
            );
            if (!updateInfo) throw `Error: Update failed, could not find a user with id of ${_id}`;
          }
        } else {
          console.error("Invalid user or grouphabitlog structure:", userInfo);
        }
      }
      const result = await groupCollection.updateOne(
        { _id: new ObjectId(groupId) },
        { $pull: { participate: userId } }
      );

      if (result.modifiedCount === 1) {
        console.log(`User with userId: ${userId} removed from participate array`);
      } else {
        console.log(`User with userId: ${userId} not found in participate array`);
      }

      return { deletedUserAndHabitLogs: true };
    } catch (error) {
      console.error('Error deleting habit logs or user:', error);
      return { error: 'Failed to delete habit logs or user' };
    }
  },

  async getGroupUserData() {
    try {
      const groupCollection = await groups();
      const userCollection = await users();
      const groupData = await groupCollection.find({}).toArray();
      const results = [];
      for (const group of groupData) {
        const groupUsers = [];
        const habit = await habitData.getHabitById(group.habit);

        if (!habit || !habit.name) {
          throw new Error(`Habit not found for ID: ${habitId}`);
        }
        for (const userId of group.participate) {
          const userInfo = await userCollection.findOne({ _id: new ObjectId(userId) });

          if (userInfo && userInfo.grouphabitlog && Array.isArray(userInfo.grouphabitlog)) {
            const habitIndex = userInfo.grouphabitlog.findIndex(entry => entry.habitname === habit.name);
            if (habitIndex !== -1) {
              const userScore = userInfo.grouphabitlog[habitIndex].totalScore;
              groupUsers.push({
                userId: userId,
                userName: `${userInfo.firstName} ${userInfo.lastName}`,
                userScore: userScore
              })
            }
            else {
              groupUsers.push({
                userId: userId,
                userName: `${userInfo.firstName} ${userInfo.lastName}`,
                userScore: 0
              })
            }
          } else {
            console.error("Invalid user or grouphabitlog structure:", groupUsers);
          }
        }
        const winner = groupUsers.reduce((prev, current) =>
          prev.userScore > current.userScore ? prev : current
        );

        results.push({
          groupId: group._id,
          groupName: group.groupname,
          users: groupUsers,
          winner: {
            userId: winner.userId,
            userName: winner.userName,
            userScore: winner.userScore,
          },
        });
      }
      return results;
    } catch (e) {
      console.error('Error fetching group data:', e);
      throw new Error('Internal Server Error');
    }
  }
};


export default exportedMethods;