const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const e = require("express");

require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .catch((error) => console.error(error));

const db = mongoose.connection;
db.on("error", error => console.error(error));
db.once("open", () => console.log("Connected to MongoDB"));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

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
    get: function (date) {
      return date.toDateString();
    },
  },
});

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
  const { username } = req.body;
  if (!username) {
    return res.json({ error: "username is required" });
  }
  const user = new User({
    username: username,
  });
  try {
    await user.save();
    return res.json({
      _id: user._id,
      username: user.username,
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
      return res.json({ error: "User not found" });
    }
    let exercise = new Exercise({
      userId: user._id,
      description: description,
      duration: duration,
    });
    if (date) {
      exercise.date = date;
    }
    user.exercises.push(exercise._id);
    await exercise.save();
    await user.save();
    return res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(_id, {
      _id: 1,
      username: 1,
    });
    if (!user) {
      return res.json({ error: "User not found" });
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
    return res.json({
      error: error.message,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
