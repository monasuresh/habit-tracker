import { ObjectId } from 'mongodb';
import { users, groups, individual } from '../config/mongoCollections.js';
import { habits } from '../config/mongoCollections.js';
import validation from '../validation.js';

const logHabit = async (emailAddress, trackedHabitName, date, time) => {
    if (!emailAddress || !trackedHabitName || !date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof trackedHabitName !== 'string') {
        throw 'The tracked habit name must be of type string';
    }

    trackedHabitName = trackedHabitName.trim();

    if (trackedHabitName.length === 0) {
        throw 'The tracked habit name must not be a string with just empty spaces.';
    }

    trackedHabitName = trackedHabitName.toUpperCase();

    emailAddress = validation.validateEmailAddress(emailAddress);

    date = validation.isValidHyphenSeparatedDate(date);

    time = validation.isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    // Check to see if there is a user with the specified email address. If not, throw an error.

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

    const habitCollection = await habits();
    const userCollection = await users();

    let habit = await habitCollection.findOne({ 'name': trackedHabitName });

    if (!habit) {
        throw 'No habit exists for the provided tracked habit name.';
    }

    let trackedHabit = await userCollection.findOne(
        { 'emailAddress': emailAddress, 'trackedHabits.habitId': habit._id },
        { projection: { _id: 0, 'trackedHabits.$': 1 } }
    );

    if (!trackedHabit || trackedHabit.trackedHabits.length === 0) {
        throw 'The provided habit has not yet been tracked.';
    }

    let newId = new ObjectId();

    const newLogEntry = {
        _id: newId,
        trackedHabitName: trackedHabitName.toUpperCase(),
        trackedHabitID: new ObjectId(trackedHabit.trackedHabits[0]._id),
        date: date,
        time: time
    }

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { habitLog: newLogEntry } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    let habitLogEntry = await getHabitLogEntryById(emailAddress, newId);

    return habitLogEntry;
}

const getHabitLogEntryById = async (emailAddress, habitLogEntryId) => {
    emailAddress = validation.validateEmailAddress(emailAddress);

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

    if (!habitLogEntryId) {
        throw 'You must provide an id to search for.';
    }

    if (!ObjectId.isValid(habitLogEntryId)) {
        throw 'Invalid id.';
    }

    const userCollection = await users();
    const habitLogEntry = await userCollection.findOne(
        { 'emailAddress': emailAddress, 'habitLog._id': habitLogEntryId },
        { projection: { _id: 0, 'habitLog.$': 1 } }
    );

    if (!habitLogEntry || habitLogEntry.habitLog.length === 0) {
        throw 'Could not find habit log entry for the provided id.';
    }

    return habitLogEntry.habitLog[0];
};

const getAllHabitLogEntries = async (emailAddress) => {
    emailAddress = validation.validateEmailAddress(emailAddress);

    await validation.checkIfEmailAddressExistsInDb(emailAddress);

    const userCollection = await users();

    const habitLogEntriesList = await userCollection.findOne({ 'emailAddress': emailAddress }, { projection: { _id: 0, habitLog: 1 } });

    if (!habitLogEntriesList) {
        throw 'Could not find habit log entries';
    }

    const habitLogEntries = habitLogEntriesList && habitLogEntriesList.habitLog ? habitLogEntriesList.habitLog : [];
    return habitLogEntries;
};

const postAllTrackedHabitsWithId = async (emailAddress, habitname, habitid, date, time, score) => {

    if (!emailAddress || !habitname || !date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof emailAddress !== 'string' || !validation.isEmailValid(emailAddress)) {
        throw 'The email address is invalid.';
    }

    emailAddress = emailAddress.trim();

    // Check to see if the email address exists in the database. If not, throw an error.

    date = validation.isValidHyphenSeparatedDate(date);

    time = validation.isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    //Checking to see if the current date/time combo is greater than the current time. If it is, it's invalid.

    /*if (!ObjectId.isValid(trackedHabitID)) {
        throw 'The provided tracked habit id is not a valid object Id.';
    } */

    console.log("I am in post tracking");

    const userCollection = await users();
    const groupCollection = await groups();

    const user = await userCollection.findOne({ 'emailAddress': emailAddress });

    if (!user) {
        throw new Error('User not found');
    }

    const existingHabitIndex = user.grouphabitlog.findIndex(entry => entry.habitname === habitname);
    console.log(habitid);
    const existingGroup = await groupCollection.findOne({
        $and: [
            { 'participate': { $in: [user._id.toString()] } },
            { 'habit': habitid }
        ]
    });

    console.log("Existing group:", existingGroup);

    const existingGroupScore = existingGroup.score;

    if (existingHabitIndex !== -1) {
        // If habitname already exists, update date and time
        //console.log("Habit name", user.grouphabitlog.existingHabitIndex.habitname);
        const existingTotalScore = parseInt(user.grouphabitlog[existingHabitIndex].totalScore);
        console.log("Existing score", existingTotalScore);
        const numScore = parseInt(score)
        const newTotalScore = existingTotalScore + numScore;
        const newGroupScore = existingGroupScore + numScore;

        const updatedHabitLog = {
            $push: {
                [`grouphabitlog.${existingHabitIndex}.log`]: {
                    date: date,
                    time: time,
                    score: numScore
                }
            },
            $set: {
                [`grouphabitlog.${existingHabitIndex}.totalScore`]: newTotalScore
            }
        };

        const updateResult = await userCollection.updateOne(
            { 'emailAddress': emailAddress, 'grouphabitlog.habitname': habitname },
            updatedHabitLog
        );
        console.log(habitid);
        console.log(updatedHabitLog);

        console.log("Before update", user._id.toString());
        try {
            const groupScore = await groupCollection.updateOne(
                {
                    $and: [
                        { 'participate': { $in: [user._id.toString()] } },
                        { 'habit': habitid }
                    ]
                },
                { $set: { 'score': newGroupScore } }
            );
            console.log("after update", groupScore);
        }
        catch (e) {
            console.log("Error: ", e);
        }
        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        return { updatedGroupHabits: true };
    } else {
        // If habitname does not exist, add a new entry
        let newId = new ObjectId();
        console.log("Score------", score);
        const newScore = parseInt(score);
        const newGroupScore = existingGroupScore + newScore;
        const habitLog = {
            _id: newId,
            habitname: habitname,
            log: [{
                date: date,
                time: time,
                score: newScore
            }],
            totalScore: newScore
        };

        const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { grouphabitlog: habitLog } });

        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        console.log("Habit id-----", habitid);
        console.log("Before update", user._id.toString());
        try {
            const groupScore = await groupCollection.updateOne(
                {
                    $and: [
                        { 'participate': { $in: [user._id.toString()] } },
                        { 'habit': habitid }
                    ]
                },
                { $set: { 'score': newGroupScore } }
            );
            console.log("after update", groupScore);
        }
        catch (e) {
            console.log("Error: ", e);
        }

        return { updatedGroupHabits: true };
    }

};

const postLogHabitsForIndividualChallenge = async (emailAddress, habitname, habitid, date, time, score) => {

    if (!emailAddress || !habitname || !date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof emailAddress !== 'string' || !validation.isEmailValid(emailAddress)) {
        throw 'The email address is invalid.';
    }

    emailAddress = emailAddress.trim();

    // Check to see if the email address exists in the database. If not, throw an error.

    date = validation.isValidHyphenSeparatedDate(date);

    time = validation.isValidTime24HourFormat(time);

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    //Checking to see if the current date/time combo is greater than the current time. If it is, it's invalid.

    /*if (!ObjectId.isValid(trackedHabitID)) {
        throw 'The provided tracked habit id is not a valid object Id.';
    } */

    console.log("I am in post tracking");

    const userCollection = await users();
    const individualCollection = await individual();

    const user = await userCollection.findOne({ 'emailAddress': emailAddress });

    if (!user) {
        throw new Error('User not found');
    }

    const existingHabitIndex = user.individualhabitlog.findIndex(entry => entry.habitname === habitname);
    console.log(habitid);
    const existingIndividualChallenge = await individualCollection.findOne({
        $and: [
            { 'userId': user._id.toString() },
            { 'habit': habitid }
        ]
    });

    console.log("Existing group:", existingIndividualChallenge);

    const existingIndividualChallengeScore = existingIndividualChallenge.score;

    if (existingHabitIndex !== -1) {
        // If habitname already exists, update date and time
        //console.log("Habit name", user.grouphabitlog.existingHabitIndex.habitname);
        const existingTotalScore = parseInt(user.individualhabitlog[existingHabitIndex].totalScore);
        console.log("Existing score", existingTotalScore);
        const numScore = parseInt(score)
        const newTotalScore = existingTotalScore + numScore;
        const newIndividualScore = existingIndividualChallengeScore + numScore;

        const updatedHabitLog = {
            $push: {
                [`individualhabitlog.${existingHabitIndex}.log`]: {
                    date: date,
                    time: time,
                    score: numScore
                }
            },
            $set: {
                [`individualhabitlog.${existingHabitIndex}.totalScore`]: newTotalScore
            }
        };

        const updateResult = await userCollection.updateOne(
            { 'emailAddress': emailAddress, 'individualhabitlog.habitname': habitname },
            updatedHabitLog
        );
        console.log(habitid);
        console.log(updatedHabitLog);

        console.log("Before update", user._id.toString());
        try {
            const IndividualScore = await individualCollection.updateOne(
                {
                    $and: [
                        { 'userId': user._id.toString() },
                        { 'habit': habitid }
                    ]
                },
                { $set: { 'score': newIndividualScore } }
            );
            console.log("after update", IndividualScore);
        }
        catch (e) {
            console.log("Error: ", e);
        }
        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        return { updatedIndividualChallengeHabits: true };
    } else {
        // If habitname does not exist, add a new entry
        let newId = new ObjectId();
        console.log("Score------", score);
        const newScore = parseInt(score);
        const newIndividualScore = existingIndividualChallengeScore + newScore;
        const habitLog = {
            _id: newId,
            habitname: habitname,
            log: [{
                date: date,
                time: time,
                score: newScore
            }],
            totalScore: newScore
        };

        const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { individualhabitlog: habitLog } });

        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        console.log("Habit id-----", habitid);
        console.log("Before update", user._id.toString());
        try {
            const individualScore = await individualCollection.updateOne(
                {
                    $and: [
                        { 'userId': user._id.toString() },
                        { 'habit': habitid }
                    ]
                },
                { $set: { 'score': newIndividualScore } }
            );
            console.log("after update", individualScore);
        }
        catch (e) {
            console.log("Error: ", e);
        }
        return { updatedIndividualChallengeHabits: true };
    }

};

const postScore = async (emailAddress, score, habitname) => {
    const userCollection = await users();
    const groupCollection = await groups();

    const user = await userCollection.findOne({ 'emailAddress': emailAddress });

    if (!user) {
        throw new Error('User not found');
    }
    console.log("User collection: ", user);
    console.log(habitname);

    const existingHabitIndex = user.grouphabitlog.findIndex(entry => entry.habitname === habitname);
    console.log(existingHabitIndex);
    console.log("log: ", user.grouphabitlog[existingHabitIndex].log);
    //const newGroupScore = user.grouphabitlog.reduce((totalScore, entry) => totalScore + entry.score, 0);
    const newScore = user.grouphabitlog[existingHabitIndex].log.reduce((total, entry) => total + entry.score, 0) + score;

    console.log(newScore);

    const updatedHabitLog = {
        $set: {
            [`grouphabitlog.${existingHabitIndex}.totalscore`]: newScore
        }
    };

    const userScore = await userCollection.updateOne(
        {
            'emailAddress': emailAddress,
            'grouphabitlog.habitname': habitname
        },
        updatedHabitLog
    );

    // Update group's score (assuming 'participate' is the correct field)
    //console.log(user._id);
    console.log("Before update", user._id.toString());
    try {
        const groupScore = await groupCollection.updateOne(
            { 'participate': { $in: [user._id.toString()] } },
            { $set: { 'score': newScore } }
        );
        console.log("after update", groupScore);
    }
    catch (e) {
        console.log("Error: ", e);
    }

    //const userScore = await userCollection.updateOne({ grouphabitlog_id: user.grouphabitlog.id }, { $set: { score: newGroupScore } });

    //const groupScore = await groupCollection.updateOne({ participate: user.id }, { $set: { score: newGroupScore } });

    if (!groupScore) throw 'Group score is not updated';
    if (!userScore) throw 'User score is not updated';

    return { updatedScore: true };

};

export default {
    logHabit,
    getAllHabitLogEntries,
    getHabitLogEntryById,
    postAllTrackedHabitsWithId,
    postScore,
    postLogHabitsForIndividualChallenge
};