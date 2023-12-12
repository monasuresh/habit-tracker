//import mongo collections, bcrypt and implement the following data functions
import { users } from '../config/mongoCollections.js';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import bcrypt from 'bcrypt';

const exportedMethods = {

  async registerUser(
    firstName,
    lastName,
    emailAddress,
    password,
    role
  ) {
    if (!firstName || !lastName || !emailAddress || !password) {
      throw 'All fields must be supplied.';
    }
    firstName = validation.validateString(firstName, 'First name', 2, 25);
    lastName = validation.validateString(lastName, 'Last name', 2, 25);
    /*role = role.toLowerCase();
    if (role !== 'admin' && role !== 'user') {
      throw 'Invalid role. The only valid values are "admin" or "user".';
    }*/
    role = "user";
    if (!validation.isEmailValid(emailAddress)) {
      throw 'Invalid email address';
    }
    password = validation.validatePassword(password);
    // Check for duplicate email address
    const userCollection = await users();

    const existingUser = await userCollection.findOne({ emailAddress: { $regex: new RegExp(`^${emailAddress}$`, 'i') } });
    if (existingUser) {
      throw new Error('User with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const newUser = {
      firstName,
      lastName,
      emailAddress,
      hashedPassword,
      role,
      trackedHabits: [],
      habitLog: [],
      grouphabitlog: [],
      individualhabitlog: []
    };

    const insertInfo = await userCollection.insertOne(newUser);

    if (insertInfo.insertedCount === 0) {
      throw new Error('Error inserting user into the database.');
    }

    return { insertedUser: true };
  },

  async loginUser(emailAdd, password) {
    // Input checking and validation
    if (!emailAdd || !password) {
      throw new Error('Both emailAddress and password must be supplied.');
    }
    if (!validation.isEmailValid(emailAdd)) {
      throw new Error('Invalid email address');
    }
    password = validation.validatePassword(password);
    const userCollection = await users();
    const user = await userCollection.findOne({ emailAddress: { $regex: new RegExp(`^${emailAdd}$`, 'i') } });

    if (!user) {
      throw new Error('Either the email address or password is invalid.');
    }
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordMatch) {
      throw new Error('Either the email address or password is invalid.');
    }

    // Return user information excluding the password
    const { _id, firstName, lastName, emailAddress, role } = user;
    return { _id, firstName, lastName, emailAddress, role };
  },

  async getUserById(userId) {
    if (!userId) throw 'You must provide an id to search for';

    if (!ObjectId.isValid(userId)) {
      throw 'The user id is not a valid ObjectId.';
    }
    console.log("I am in get by user id:", userId);
    const userCollection = await users();
    const users = await userCollection.findOne({ _id: new ObjectId(userId) });
    console.log(users);
    if (!users) throw 'No Users with that id';
    return users;
  }

};

export default exportedMethods;