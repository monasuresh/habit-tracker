//import mongo collections, bcrypt and implement the following data functions
import { individual } from '../config/mongoCollections.js';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import bcrypt from 'bcrypt';

const exportedMethods = {

  async addIndividual(challengename, habit, startdate, enddate, userId) {
    if (!challengename || !habit || !startdate || !enddate) {
      throw new Error('All the fields needs to be supplied');
    }
    const individualCollection = await individual();
    // Here check for if group is already exist
    // Insert group into the database
    const newIndividual = {
      challengename,
      habit,
      startdate,
      enddate,
      score: 0,
      userId
    };
    console.log(newIndividual);

    const insertInfo = await individualCollection.insertOne(newIndividual);

    if (insertInfo.insertedCount === 0) {
      throw new Error('Error inserting individual challenge into the database.');
    }

    return { insertedGroup: true };
  },

  async getIndividualById(id) {
    //id = validation.checkId(id);
    console.log("individual Id:", id);
    const individualCollection = await individual();
    console.log("individual Id----", new ObjectId(id));
    const individuals = await individualCollection.find({ userId: id }).toArray();
    console.log("Individual list:", individuals);
    //if (!individuals) throw 'Error: Individual not found';

    return individuals;
  }
};

export default exportedMethods;