import userValidation from '../helpers/userValidations.js';
import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
const saltRounds = 16;

const addUser = async (firstname, lastname, username, password, emailAddress) => {
  // Validate user parameters
  userValidation.validateUserParams(firstname, lastname, username, password, emailAddress);

  const hash = await bcrypt.hash(password, saltRounds);

  // Generate a new ObjectId for the new user
  let newId = new ObjectId();

  // Create a new user object
  const newUser = {
    _id: newId,
    firstname: firstname,
    lastname: lastname,
    username: username,
    password: hash,
    email: emailAddress,
    habits: [],
    groups: [],
    score: 0
  };

  const userCollection = await users();

  // Insert the new user into the Users collection
  const insertResult = await userCollection.insertOne(newUser);

  if (!insertResult) {
    throw 'Could not insert user successfully';
  }

  // Retrieve and return the newly added user
  let userToReturn = await get(insertResult.insertedId);

  return userToReturn;
};

export default {
  addUser
};