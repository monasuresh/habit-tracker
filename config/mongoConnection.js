import {MongoClient} from 'mongodb';
import {mongoConfig} from './settings.js';

let _connection = undefined;
let _db = undefined;

const dbConnection = async () => {
  if (!_connection) {

    try {
      _connection = await MongoClient.connect(mongoConfig.serverUrl);
      _db = _connection.db(mongoConfig.database);
  
      const collections = await _db.listCollections().toArray();
      console.log('First document in each collection:');
  
      for (const collection of collections) {
        const coll = _db.collection(collection.name);
        const firstDoc = await coll.findOne(); // Fetches the first document in the collection
        console.log(`Collection: ${collection.name}`);
        // console.log(firstDoc); // This prints the first document of the collection
      }
  } catch (error) {
      console.error("Failed to connect to MongoDB", error);
  }
   
  }

  return _db;
};
const closeConnection = async () => {
  await _connection.close();
};

export {dbConnection, closeConnection};