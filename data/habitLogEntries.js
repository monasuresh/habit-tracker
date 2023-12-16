import { ObjectId } from 'mongodb';
import { users, groups, individual } from '../config/mongoCollections.js';
import { habits } from '../config/mongoCollections.js';
import validation from '../validation.js';

const logHabit = async (emailAddress, trackedHabitName, date, time) => {
    if (!emailAddress || !trackedHabitID || !date || !time) {
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

    // Get the habit ID

    const habitCollection = await habits();

    let habit = await habitCollection.findOne({ 'name': trackedHabitName });



    let newId = new ObjectId();

    const newLogEntry = {
        _id: newId,
        trackedHabitName: trackedHabitName,
        trackedHabitID: new ObjectId(trackedHabitID),
        date: date,
        time: time
    }

    const userCollection = await users();

    const updateResult = await userCollection.updateOne({ 'emailAddress': emailAddress }, { $push: { habitLog: newLogEntry } });

    if (!updateResult) {
        throw 'Could not update user tracked habit successfully';
    }

    return { updatedTrackedHabits: true };
};

const getHabitLogEntryById = async (habitLogEntryId) => {
    const userCollection = await users();
    const habitLogEntry = await userCollection.findOne(
        { 'habitLog._id': new ObjectId(habitLogEntryId) },
        { projection: { _id: 0, 'habitLog.$': 1 } }
    );

    if (!habitLogEntry) {
        throw 'Could not find habit log entry for the provided id.';
    }

    return habitLogEntry.habitLog[0];
};

const getAllHabitLogEntries = async (emailAddress) => {
    //Check to see if the email address is a valid string
    const userCollection = await users();
    const habitLogEntriesList = await userCollection.findOne({ 'emailAddress': emailAddress }, { projection: { _id: 0, habitLog: 1 } });
    if (!habitLogEntriesList) {
        throw 'Could not find habit log entries';
    }

    const habitLogEntries = habitLogEntriesList && habitLogEntriesList.habitLog ? habitLogEntriesList.habitLog : [];
    return habitLogEntries;
};

const postAllTrackedHabitsWithId = async (emailAddress, habitname, habitid, date, time, score) => {
    if (!date || !time) {
        throw 'All fields must be supplied';
    }

    if (typeof emailAddress !== 'string' || !validation.isEmailValid(emailAddress)) {
        throw 'The email address is invalid.';
    }

    emailAddress = emailAddress.trim();

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }
    const userCollection = await users();
    const groupCollection = await groups();

    const user = await userCollection.findOne({ 'emailAddress': emailAddress });

    if (!user) {
        throw new Error('User not found');
    }

    const existingHabitIndex = user.grouphabitlog.findIndex(entry => entry.habitname === habitname);
    const existingGroup = await groupCollection.findOne({
        $and: [
            { 'participate': { $in: [user._id.toString()] } },
            { 'habit': habitid }
        ]
    });

    const existingGroupScore = existingGroup.score;

    if (existingHabitIndex !== -1) {

        const existingTotalScore = parseInt(user.grouphabitlog[existingHabitIndex].totalScore);
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
            if (!groupScore) throw 'Group score is not updated';
        }
        catch (e) {
            console.log("Error: ", e);
        }
        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        return { updatedGroupHabits: true };
    } else {
        let newId = new ObjectId();
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
            if (!groupScore) throw 'Group score not updated'
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

    const userCollection = await users();
    const emailInfo = await userCollection.findOne({ emailAddress: emailAddress });
    if (!emailInfo) throw 'Email Address is not in database';

    let dateTimeInput = new Date(date + 'T' + time);
    let currentDateTime = new Date();

    if (dateTimeInput > currentDateTime) {
        throw 'The date/time logged must be not after the current date/time.';
    }

    const individualCollection = await individual();

    const user = await userCollection.findOne({ 'emailAddress': emailAddress });

    if (!user) {
        throw new Error('User not found');
    }

    const existingHabitIndex = user.individualhabitlog.findIndex(entry => entry.habitname === habitname);
    const existingIndividualChallenge = await individualCollection.findOne({
        $and: [
            { 'userId': user._id.toString() },
            { 'habit': habitid }
        ]
    });

    const existingIndividualChallengeScore = existingIndividualChallenge.score;

    if (existingHabitIndex !== -1) {

        const existingTotalScore = parseInt(user.individualhabitlog[existingHabitIndex].totalScore);
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
            if (!IndividualScore) throw 'Invidual score is not updated!'
        }
        catch (e) {
            console.log("Error: ", e);
        }
        if (!updateResult) {
            throw 'Could not update user group habit successfully';
        }
        return { updatedIndividualChallengeHabits: true };
    } else {
        let newId = new ObjectId();
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
            if (!individualScore) throw 'Individual score does not updated!'
        }
        catch (e) {
            console.log("Error: ", e);
        }
        return { updatedIndividualChallengeHabits: true };
    }

};

export default {
    logHabit,
    getAllHabitLogEntries,
    getHabitLogEntryById,
    postAllTrackedHabitsWithId,
    postLogHabitsForIndividualChallenge
};