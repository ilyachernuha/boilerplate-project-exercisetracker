const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Exercise = require("../models/exercise");

router.post("/", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.json({ error: "username is required" });
  }
  const user = new User({
    username: username,
  });
  try {
    await user.save();
    return res.status(201).json({
      _id: user._id,
      username: user.username,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, username: 1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:_id/exercises", async (req, res) => {
  const _id = req.params._id;
  const { description, duration, date } = req.body;
  const parsedDate = new Date(date);
  if (description === "" || duration === "") {
    return res.json({ error: "description and duration are required" });
  }
  if (!/^[0-9]*$/.test(duration)) {
    return res.json({ error: "invalid duration" });
  }
  if (date !== "" && parsedDate == "Invalid Date") {
    return res.json({ error: "invalid date" });
  }
  try {
    let user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let exercise = new Exercise({
      userId: user._id,
      description: description,
      duration: duration,
    });
    if (date) {
      exercise.date = date;
    }
    await exercise.save();
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(_id, {
      _id: 1,
      username: 1,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const exercises = await Exercise.find(
      { userId: _id },
      { description: 1, duration: 1, date: 1 }
    ).exec();
    return res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
