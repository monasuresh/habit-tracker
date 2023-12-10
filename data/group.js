//import mongo collections, bcrypt and implement the following data functions
import { groups } from '../config/mongoCollections.js';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import bcrypt from 'bcrypt';

const exportedMethods = {

  async addGroups(groupname, habit, startdate, enddate, participate, userId) {
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
    // Insert group into the database
    const newGroup = {
      groupname,
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
    console.log("Id:",id);
    const groupCollection = await groups();
    console.log("Id----",id);
    //const group = await groupCollection.findOne({ _id: new ObjectId(id) });
    const group = await groupCollection.find({
      participate: {
          $elemMatch: { $eq: id }
      }
    }).toArray();
    console.log("Group list:",group);
    if (!group) throw 'Error: Group not found';

    return group;
  }
};

export default exportedMethods;