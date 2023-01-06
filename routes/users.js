const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Exercise = require("../models/exercise");

router.post("/", async (req, res) => {
  const user = new User({ username: req.body.username });
  try {
    await user.save();
    return res.status(201).json({ _id: user._id, username: user.username });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { username: 1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/:_id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: req.body.duration,
    });
    if (req.body.date) {
      exercise.date = req.body.date;
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
    return res.status(400).json({ error: error.message });
  }
});

router.get("/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const exercisesQuery = { userId: user._id };
    if (req.query.from || req.query.to) {
      exercisesQuery.date = {};
      if (req.query.from) {
        exercisesQuery.date.$gte = req.query.from;
      }
      if (req.query.to) {
        exercisesQuery.date.$lte = req.query.to;
      }
    }
    const exercises = await Exercise.find(exercisesQuery, {
      description: 1,
      duration: 1,
      date: 1,
    }).limit(req.query.limit);
    return res.json({
      _id: user._id,
      count: exercises.length,
      log: exercises,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
