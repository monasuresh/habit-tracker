import { ObjectId } from 'mongodb';
import { users, groups, individual,habits } from '../config/mongoCollections.js';
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

const getStreakReport = async (userId) => {
    if (!userId) throw "User ID is required";
  
    const userCollection = await users();
    const habitsCollection = await habits();
  
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) throw `User with ID ${userId} not found`;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Today's date for comparison: ${today.toISOString()}`);
  
    let streaksReport = {
      goodHabits: [],
      badHabits: []
    };
  
    for (const trackedHabit of user.trackedHabits) {
      const habit = await habitsCollection.findOne({ _id: trackedHabit.habitId });
      const logs = user.habitLog.filter(log => log.trackedHabitID.equals(trackedHabit._id));
  
      let streakStatus = 'completed';
      console.log(`Evaluating habit: ${habit.name}`);
  
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
  
        const formattedCheckDate = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;
        console.log(`Checking date: ${formattedCheckDate}`);
  
        let dayHasLog = logs.some(log => {
          const logDate = new Date(`${log.date}T${log.time}`);
          const formattedLogDate = `${logDate.getFullYear()}-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-${logDate.getDate().toString().padStart(2, '0')}`;
          return formattedLogDate === formattedCheckDate;
        });
  
        console.log(`Log found for date ${formattedCheckDate}: ${dayHasLog}`);
        if (!dayHasLog) {
          streakStatus = 'broken';
          console.log(`Streak broken on: ${formattedCheckDate}`);
          break;
        }
      }
  
      const streakData = {
        habitName: habit.name,
        streakStatus: streakStatus
      };
  
      if (habit.effect === 'good') {
        streaksReport.goodHabits.push(streakData);
      } else {
        streaksReport.badHabits.push(streakData);
      }
    }
  
    console.log(`Streaks Report:`, streaksReport);
    return streaksReport;
  };
  
  
export default {
    logHabit,
    getAllHabitLogEntries,
    getHabitLogEntryById,
    getStreakReport,
    postAllTrackedHabitsWithId,
    postLogHabitsForIndividualChallenge
};