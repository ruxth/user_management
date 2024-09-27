const db = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const validateAppAcronym = (App_Acronym) => {
  const acronymRegex = /^[a-zA-Z0-9_]{1,50}$/;
  return acronymRegex.test(App_Acronym);
};

exports.addApplication = catchAsyncErrors(async (req, res, next) => {
  const {
    App_Acronym,
    App_Rnumber,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_Create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
  } = req.body.newApplication;

  if (!App_Acronym || App_Acronym.trim() === "") {
    return res.status(400).json({ message: "App_Acronym cannot be empty." });
  }

  if (!validateAppAcronym(App_Acronym)) {
    return res.status(400).json({
      message:
        "App_Acronym must be unique, between 1 to 50 characters, alphanumeric and include '_'",
    });
  }

  if (App_Rnumber < 1) {
    return res.status(400).json({
      message:
        "App_Rnumber cannot be negative and must be greater than or equal to 1.",
    });
  }

  if (!App_startDate || !App_endDate) {
    return res.status(400).json({
      message: "Start date and End date cannot be empty.",
    });
  }

  const connection = await db.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Start the transaction

    const checkAcronymQuery =
      "SELECT COUNT(*) as count FROM application WHERE App_Acronym = ?";
    const [rows] = await connection.query(checkAcronymQuery, [App_Acronym]);

    if (rows[0].count > 0) {
      return res.status(400).json({ message: "App_Acronym must be unique." });
    }

    const addApplicationQuery =
      "INSERT INTO application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    await connection.query(addApplicationQuery, [
      App_Acronym,
      App_Description,
      App_Rnumber,
      App_startDate,
      App_endDate,
      App_permit_Create,
      App_permit_Open,
      App_permit_toDoList,
      App_permit_Doing,
      App_permit_Done,
    ]);

    await connection.commit(); // Commit the transaction
    res.status(200).json({ message: "Application added successfully!" });
  } catch (error) {
    await connection.rollback(); // Rollback the transaction on error
    console.error("Error adding application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

exports.editApplication = catchAsyncErrors(async (req, res, next) => {
  const {
    App_Acronym,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_Create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
  } = req.body.currentApplication;

  const updateApplicationQuery =
    "UPDATE application SET App_Description = ?, App_startDate = ?, App_endDate = ?, App_permit_Create = ?, App_permit_Open = ?, App_permit_toDoList = ?, App_permit_Doing = ?, App_permit_Done = ? WHERE App_Acronym = ?;";

  const values = [
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_Create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
    App_Acronym,
  ];

  if (!App_startDate || !App_endDate) {
    return res.status(400).json({
      message: "Start date and End date cannot be empty.",
    });
  }

  try {
    await db.query(updateApplicationQuery, values);
    res.status(200).json({ message: "Application edited successfully!" });
  } catch (error) {
    console.error("Error editing application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getAllApplications = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  username = req.user.id;

  try {
    const query =
      "SELECT DISTINCT A.* FROM application A JOIN usergroup U ON U.user_group = A.app_permit_Create OR U.user_group = A.App_permit_Open OR U.user_group = A.App_permit_toDoList OR U.user_group = A.App_permit_Doing OR U.user_group = A.App_permit_Done WHERE U.username = ?";
    const [rows] = await db.query(query, [username]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getApplication = catchAsyncErrors(async (req, res, next) => {
  try {
    const { App_Acronym } = req.body;

    const getApplicationQuery =
      "SELECT * FROM application WHERE App_Acronym = ?";
    const [rows] = await db.query(getApplicationQuery, [App_Acronym]);

    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getPlans = catchAsyncErrors(async (req, res, next) => {
  const getPlansQuery = "SELECT * FROM plan";
  try {
    const [rows] = await db.query(getPlansQuery);

    if (rows.length > 0) {
      res.status(200).json(rows);
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getTasks = catchAsyncErrors(async (req, res, next) => {
  const { appAcronym } = req.body;
  const getTasksQuery = `
    SELECT t.*, p.Plan_color
    FROM task t
    LEFT JOIN plan p ON t.Task_plan = p.Plan_MVP_name
    WHERE t.Task_app_Acronym = ?;`;
  try {
    const [rows] = await db.query(getTasksQuery, [appAcronym]);

    if (rows.length > 0) {
      rows.forEach((row) => {
        // console.log("Task_notes before parsing:", row.Task_notes); // Log the value

        if (row.Task_notes) {
          try {
            row.Task_notes = JSON.parse(row.Task_notes);
          } catch (e) {
            row.Task_notes = [];
          }
        } else {
          row.Task_notes = [];
        }
      });

      res.status(200).json(rows);
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.createPlan = catchAsyncErrors(async (req, res, next) => {
  const { appAcronym, planName, startDate, endDate, color } = req.body.plan;

  const createPlanQuery =
    "INSERT INTO plan (Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate, Plan_color) VALUES (?, ?, ?, ?, ?)";

  if (!planName || !startDate || !endDate) {
    return res.status(400).json({
      message: "Plan name, start date and end date fields are required.",
    });
  }

  try {
    const [rows] = await db.query(createPlanQuery, [
      planName,
      appAcronym,
      startDate,
      endDate,
      color,
    ]);

    res.status(200).json({ message: "Plan added successfully!" });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.createTask = catchAsyncErrors(async (req, res, next) => {
  const {
    taskID,
    taskName,
    appAcronym,
    taskDescription,
    planName,
    taskState,
    taskCreator,
    taskOwner,
    taskDate,
    taskNotes,
  } = req.body.newTask;

  if (!taskName || taskName.trim() === "") {
    return res.status(400).json({ message: "Task name cannot be empty." });
  }

  const createTaskQuery =
    "INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const RnumberQuery =
    "UPDATE application SET App_Rnumber = App_Rnumber + 1 WHERE App_Acronym = ?";

  const values = [
    taskID,
    planName,
    appAcronym,
    taskName,
    taskDescription,
    taskNotes,
    taskState,
    taskCreator,
    taskOwner,
    taskDate,
  ];

  const connection = await db.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Start the transaction

    const [rows] = await connection.query(createTaskQuery, values); // Create the task
    const [RnumberRow] = await connection.query(RnumberQuery, [appAcronym]); // Update Rnumber

    await connection.commit(); // Commit the transaction
    res.status(200).json({ message: "Task added successfully!" });
  } catch (error) {
    await connection.rollback(); // Rollback the transaction in case of error
    console.error("Error adding task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

function getNextState(currentState) {
  const stateOrder = {
    Open: "ToDo",
    ToDo: "Doing",
    Doing: "Done",
    Done: "Closed",
    Closed: null, // No next state for closed
  };

  return stateOrder[currentState] || null; // Return null if the current state is not valid
}

function getPreviousState(currentState) {
  const stateOrder = {
    Open: null,
    ToDo: null,
    Doing: "ToDo",
    Done: "Doing",
    Closed: null, // No next state for closed
  };

  return stateOrder[currentState] || null; // Return null if the current state is not valid
}

exports.editTask = catchAsyncErrors(async (req, res, next) => {
  const {
    Task_id,
    Task_plan,
    Task_app_Acronym,
    Task_name,
    Task_description,
    Task_notes,
    Task_state,
    Task_creator,
    Task_owner,
    Task_createDate,
  } = req.body.task;

  const editTaskQuery =
    "UPDATE task SET Task_plan = ?, Task_name = ?, Task_description = ?, Task_notes = ? WHERE Task_id = ?;";
  const values = [Task_plan, Task_name, Task_description, Task_notes, Task_id];

  try {
    const [rows] = await db.query(editTaskQuery, values);
    res.status(200).json({ message: "Task edited successfully!" });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.updateTask = catchAsyncErrors(async (req, res) => {
  const { taskID, action } = req.body;
  console.log(taskID);
  console.log(action);

  //
  const [taskRows] = await db.query(
    "SELECT Task_state FROM task WHERE Task_id = ?",
    [taskID]
  );
  // accessing the first row of results
  const currentState = taskRows[0]?.Task_state;

  if (!currentState) {
    return res.status(403).json({ message: "Access denied" });
  }

  let newState;

  if (action === "promote") {
    newState = getNextState(currentState);
  } else if (action === "demote") {
    newState = getPreviousState(currentState);
  } else {
    return res.status(400).json({ message: "Invalid action." });
  }

  await db.query("UPDATE task SET Task_state = ? WHERE Task_id = ?", [
    newState,
    taskID,
  ]);

  res
    .status(200)
    .json({ message: "Task state updated successfully!", newState });
});
