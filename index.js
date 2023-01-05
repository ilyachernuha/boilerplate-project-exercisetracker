const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI).catch((error) => console.error(error));
const connection = mongoose.connection;

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  exercises: [
    {
      type: ObjectId,
      ref: "Exercise",
    },
  ],
});

const exerciseSchema = new Schema({
  userId: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
    });
    await newUser.save();
    return res.json({
      _id: newUser._id,
      username: newUser.username,
    });
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, username: 1 });
    return res.json(users);
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let user = await User.findById(req.params._id);
    if (!user) {
      return res.json({error: "User not found"});
    }
    let exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: req.body.duration
    });
    const date = Date.parse(req.body.date);
    if (!date) {
      exercise.date = new Date(date);
    }
    user.exercises.push(exercise._id);
    await user.save();
    return res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    });
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.json({ error: "User not found" });
    }
    return res.json({
      _id: user._id,
      username: user.username,
      count: user.exercises.length,
      log: user.exercises,
    });
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
