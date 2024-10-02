const db = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

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

  console.log(App_permit_Create);
  console.log(App_Acronym);

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
    const query = "SELECT * FROM application ";
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

exports.getPlans = catchAsyncErrors(async (req, res) => {
  const { appAcronym } = req.body;

  if (!appAcronym) {
    return res.status(400).json({ message: "appAcronym is not found." });
  }

  const query = "SELECT Plan_MVP_name FROM plan WHERE Plan_app_Acronym = ?";

  try {
    const [rows] = await db.query(query, [appAcronym]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getTasks = catchAsyncErrors(async (req, res, next) => {
  const { appAcronym } = req.body;
  const getTasksQuery = `
    SELECT DISTINCT t.*, p.Plan_color
    FROM task t
    LEFT JOIN plan p ON t.Task_plan = p.Plan_MVP_name
    WHERE t.Task_app_Acronym = ?;`;
  try {
    const [rows] = await db.query(getTasksQuery, [appAcronym]);

    if (rows.length > 0) {
      rows.forEach((row) => {
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

      // console.log(getTasksQuery, [appAcronym]);
      // console.log(rows);

      res.status(200).json(rows);
    }
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.createPlan = catchAsyncErrors(async (req, res, next) => {
  const { appAcronym, planName, startDate, endDate, color } = req.body.plan;

  const checkUniqueQuery =
    "SELECT COUNT(*) AS count FROM plan WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?";
  const [uniqueCheckRows] = await db.query(checkUniqueQuery, [
    planName,
    appAcronym,
  ]);

  if (uniqueCheckRows[0].count > 0) {
    return res.status(400).json({
      message: "Plan name must be unique.",
    });
  }

  if (!planName || !startDate || !endDate) {
    return res.status(400).json({
      message: "Plan name, start date, and end date fields are required.",
    });
  }

  if (planName.length > 255) {
    return res.status(400).json({
      message: "Plan name cannot exceed 255 characters.",
    });
  }

  const createPlanQuery =
    "INSERT INTO plan (Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate, Plan_color) VALUES (?, ?, ?, ?, ?)";

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
    console.error("Error adding plan:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.createTask = catchAsyncErrors(async (req, res, next) => {
  const {
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

  const finalPlanName = planName ? planName : null;

  const creationDate = new Date().toLocaleDateString();
  const creationTime = new Date().toLocaleTimeString();
  const hardcodedCreationNote = {
    date: creationDate,
    time: creationTime,
    state: taskState || "Unknown",
    notedBy: taskCreator || "Unknown",
    taskNote: `Task is created`,
  };

  let notesArray = JSON.parse(taskNotes || "[]");
  notesArray.push(hardcodedCreationNote);

  const createTaskQuery =
    "INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const RnumberQuery =
    "UPDATE application SET App_Rnumber = App_Rnumber + 1 WHERE App_Acronym = ?";

  const getRnumberQuery =
    "SELECT App_Rnumber FROM application WHERE App_Acronym = ?";

  const values = [
    null,
    finalPlanName,
    appAcronym,
    taskName,
    taskDescription,
    JSON.stringify(notesArray),
    taskState,
    taskCreator,
    taskOwner,
    taskDate,
  ];

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(RnumberQuery, [appAcronym]);

    const [rnumberResult] = await connection.query(getRnumberQuery, [
      appAcronym,
    ]);
    const updatedRnumber = rnumberResult[0].App_Rnumber;

    const taskID = `${appAcronym}_${updatedRnumber}`;
    values[0] = taskID;

    await connection.query(createTaskQuery, values);

    await connection.commit();
    res.status(200).json({ message: "Task added successfully!" });
  } catch (error) {
    await connection.rollback(); // Rollback the transaction in case of error
    console.error("Error adding task:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

exports.editTask = catchAsyncErrors(async (req, res, next) => {
  const {
    Task_id,
    Task_plan,
    Task_app_Acronym,
    Task_name,
    Task_description,
    Task_notes, // This will be a JSON string from the frontend
    Task_state,
    Task_creator,
    Task_owner,
    Task_createDate,
  } = req.body.updateTask;

  const currentTaskQuery =
    "SELECT Task_plan, Task_notes FROM task WHERE Task_id = ?";
  const [currentTaskRows] = await db.query(currentTaskQuery, [Task_id]);
  const currentTask = currentTaskRows[0];

  if (!currentTask) {
    return res.status(404).json({ message: "Task not found." });
  }

  let updatedNotes = JSON.parse(Task_notes || "[]");

  if (currentTask.Task_plan !== Task_plan) {
    const noteDate = new Date().toLocaleDateString();
    const noteTime = new Date().toLocaleTimeString();
    const hardcodedNote = {
      date: noteDate,
      time: noteTime,
      state: Task_state || "Unknown",
      notedBy: Task_owner || "Unknown",
      taskNote: `Task plan changed from ${currentTask.Task_plan} to ${Task_plan}.`,
    };

    updatedNotes.push(hardcodedNote);
  }

  const editTaskQuery =
    "UPDATE task SET Task_plan = ?, Task_name = ?, Task_description = ?, Task_notes = ? WHERE Task_id = ?;";
  const values = [
    Task_plan,
    Task_name,
    Task_description,
    JSON.stringify(updatedNotes),
    Task_id,
  ];

  try {
    await db.query(editTaskQuery, values);
    res.status(200).json({ message: "Task edited successfully!" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "ruth142976@gmail.com",
    subject: "Task Notification",
    text: "Hello, the task in your application is ready for review.",
  };

  transporter
    .sendMail(mailOptions)
    .then((res) => console.log(`msg id: ${res.messageId}`))
    .catch((e) => console.error(e));
};

exports.updateTask = catchAsyncErrors(async (req, res) => {
  const {
    Task_id,
    Task_plan,
    Task_app_Acronym,
    Task_notes, // This will be a JSON string from the frontend
    Task_state,
    Task_owner,
  } = req.body.updateTask;

  const { action } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [taskRows] = await connection.query(
      "SELECT Task_state, Task_owner FROM task WHERE Task_id = ?",
      [Task_id]
    );

    const currentTask = taskRows[0];
    const currentState = currentTask?.Task_state;

    if (!currentState) {
      return res.status(403).json({ message: "Access denied" });
    }

    let newState;

    // Parse the incoming Task_notes JSON string into an array
    let notesArray = JSON.parse(Task_notes || "[]");

    // Create a new note object
    const noteDate = new Date().toLocaleDateString();
    const noteTime = new Date().toLocaleTimeString();
    let formattedNote;

    if (action === "promote") {
      newState = getNextState(currentState);
      formattedNote = {
        date: noteDate,
        time: noteTime,
        state: newState,
        notedBy: Task_owner || "Unknown",
        taskNote: `Task promoted to ${newState}`,
      };
      notesArray.push(formattedNote); // Append the new note
    } else if (action === "demote") {
      newState = getPreviousState(currentState);
      formattedNote = {
        date: noteDate,
        time: noteTime,
        state: newState,
        notedBy: Task_owner || "Unknown",
        taskNote: `Task demoted to ${newState}`,
      };
      notesArray.push(formattedNote); // Append the new note
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    const updates = [];
    const params = [newState, Task_id];

    if (currentState === "Open" || currentState === "Done") {
      if (Task_plan) {
        updates.push("Task_plan = ?");
        params.splice(-1, 0, Task_plan);
      }
    }

    if (action === "promote" && Task_owner) {
      updates.push("Task_owner = ?");
      params.splice(-1, 0, Task_owner);
    }

    const updatedNotesJson = JSON.stringify(notesArray);
    updates.push("Task_notes = ?");
    params.splice(-1, 0, updatedNotesJson);

    if (updates.length > 0) {
      const updateQuery = `UPDATE task SET Task_state = ?, ${updates.join(
        ", "
      )} WHERE Task_id = ?`;
      await connection.query(updateQuery, params);
    }

    await connection.commit();

    const emailQuery =
      "SELECT accounts.email from accounts JOIN usergroup ON usergroup.username = accounts.username JOIN application ON usergroup.user_group = application.App_permit_Done WHERE App_Acronym = ?";
    const [results] = await db.query(emailQuery, [Task_app_Acronym]);

    const emails = results
      .map((obj) => obj.email)
      .filter((email) => email)
      .join(", ");

    if (newState === "Done") {
      //sendEmail(emails)g
      sendEmail();
    }
    res.status(200).json({ message: "Task updated successfully!", newState });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the task." });
  } finally {
    connection.release();
  }
});
