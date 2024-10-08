const MsgCode = require("../config/error");
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
  console.log(`req.originalUrl: ${req.originalUrl}`);
  if (Object.keys(req.query).length != 0) {
    res.status(400).json({ msgCode: MsgCode.INVALID_PARAMETER });
    return;
  }
  const validUrls = [
    "/api/demo/CreateTask",
    "/api/demo/GetTaskbyState",
    "/api/demo/PromoteTask2Done",
  ];
  const url = req.originalUrl;
  console.log("incoming url:", url);

  let isValidUrl = false;

  for (const i of validUrls) {
    if (i.toLowerCase() === url.toLowerCase()) {
      isValidUrl = true;
      break;
    }
  }

  if (isValidUrl) {
    next();
    return;
  }

  res.status(400).json({ msgCode: MsgCode.INVALID_URL });
  return;
});

router.post("/CreateTask", async (req, res) => {
  const {
    username,
    password,
    taskName,
    appAcronym,
    taskDescription,
    taskNotes,
    planName,
  } = req.body;

  const allowedKeys = [
    "username",
    "password",
    "taskName",
    "appAcronym",
    "taskDescription",
    "taskNotes",
    "planName",
  ];

  const invalidKeys = Object.keys(req.body).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (invalidKeys.length > 0) {
    res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
    return;
  }

  if (!username || !password) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [rows] = await db.query(
    "SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)",
    [username]
  );
  if (rows.length === 0) {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (user.isActive !== "active") {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (!taskName || taskName.trim() === "" || !appAcronym) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [app] = await db.query(
    `SELECT COUNT(*) AS count FROM application WHERE App_Acronym = ?`,
    [appAcronym]
  );

  const [plan] = await db.query(
    `SELECT COUNT(*) AS count FROM plan WHERE Plan_MVP_name = ?`,
    [planName]
  );

  if ((planName && plan[0].count === 0) || app[0].count === 0) {
    return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
  }

  const [permit] = await db.query(
    `SELECT COUNT(*) AS count
     FROM usergroup ug
     JOIN application a ON ug.user_group = a.App_permit_Create
     WHERE ug.username = ?;`,
    [username]
  );

  const permitCount = permit[0].count;

  if (permitCount === 0) {
    return res.status(403).json({ msgCode: MsgCode.NOT_AUTHORIZED });
  }

  const currentDate = new Date();
  const taskState = "Open";
  const taskCreator = username;
  const taskOwner = username;
  const taskDate = Math.floor(currentDate.getTime() / 1000);
  const creationTime = new Date().toLocaleTimeString();

  const hardcodedCreationNote = {
    date: currentDate,
    time: creationTime,
    state: taskState,
    notedBy: taskCreator,
    taskNote: "Task is created",
  };
  const formattedNote = `[Creator: ${hardcodedCreationNote.notedBy}, Date: ${hardcodedCreationNote.date}, Time: ${hardcodedCreationNote.time}, State: ${hardcodedCreationNote.state}]`;

  const combinedNotes = taskNotes
    ? `${taskNotes}\n${formattedNote}`
    : formattedNote;

  if (combinedNotes.length > 2 ** 24 - 1) {
    res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
    return;
  }

  if (taskDescription.length > 2 ** 16 - 1) {
    res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
    return;
  }

  const createTaskQuery = `
      INSERT INTO task (
        Task_id, Task_plan, Task_app_Acronym, Task_name,
        Task_description, Task_notes, Task_state, Task_creator,
        Task_owner, Task_createDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const RnumberQuery =
    "UPDATE application SET App_Rnumber = App_Rnumber + 1 WHERE App_Acronym = ?";
  const getRnumberQuery =
    "SELECT App_Rnumber FROM application WHERE App_Acronym = ?";

  const values = [
    null,
    planName,
    appAcronym,
    taskName,
    taskDescription,
    combinedNotes,
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
    // if (!rnumberResult || rnumberResult.length === 0) {
    //   throw new Error("Application not found.");
    // }

    const updatedRnumber = rnumberResult[0].App_Rnumber;
    const taskId = `${appAcronym}_${updatedRnumber}`;
    values[0] = taskId;

    const [result] = await connection.query(createTaskQuery, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ msgCode: MsgCode.NOT_FOUND });
    }

    await connection.commit();
    res.status(200).json({
      msgCode: MsgCode.SUCCESS,
      result: {
        Task_id: taskId,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error adding task:", error);
    res.status(500).json({ msgCode: MsgCode.INTERNAL });
  } finally {
    connection.release();
  }
});

router.post("/GetTaskByState", async (req, res) => {
  const { username, password, taskState, appAcronym } = req.body;

  const allowedKeys = ["username", "password", "taskState", "appAcronym"];

  const validStates = ["open", "todo", "doing", "done", "closed"];
  if (!validStates.includes(taskState)) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const invalidKeys = Object.keys(req.body).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (invalidKeys.length > 0) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
  }

  if (!username || !password) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [rows] = await db.query(
    "SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)",
    [username]
  );
  if (rows.length === 0) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (user.isActive !== "active") {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (!taskState || !appAcronym) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [app] = await db.query(
    `SELECT COUNT(*) AS count FROM application WHERE App_Acronym = ?`,
    [appAcronym]
  );

  if (app[0].count === 0) {
    return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
  }

  const getTasksQuery = `
      SELECT DISTINCT t.*
      FROM task t
      WHERE t.Task_app_Acronym = ? AND t.Task_state = ?;`;

  try {
    const [taskRows] = await db.query(getTasksQuery, [appAcronym, taskState]);

    res.status(200).json({
      results: taskRows,
      msgCode: MsgCode.SUCCESS,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ msgCode: MsgCode.INTERNAL });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (emails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails,
    subject: "Task Notification",
    text: "Hello, the task in your application is ready for review.",
  };

  transporter
    .sendMail(mailOptions)
    .then((res) => console.log(`msg id: ${res.messageId}`))
    .catch((e) => console.error(e));
};

router.post("/PromoteTask2Done", async (req, res) => {
  const { username, password, taskId, appAcronym, taskNotes } = req.body;

  const allowedKeys = [
    "username",
    "password",
    "taskId",
    "appAcronym",
    "taskNotes",
  ];

  const invalidKeys = Object.keys(req.body).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (invalidKeys.length > 0) {
    res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
    return;
  }

  if (!username || !password) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [rows] = await db.query(
    "SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)",
    [username]
  );

  if (rows.length === 0) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (user.isActive !== "active") {
    return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
  }

  if (!taskId || !appAcronym) {
    return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
  }

  const [task] = await db.query(
    `SELECT * 
     FROM task 
     WHERE Task_app_Acronym = ? AND task_id = ?`,
    [appAcronym, taskId]
  );

  if (task.length === 0) {
    return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
  }

  const [taskRows] = await db.query(
    "SELECT Task_state, Task_owner FROM task WHERE Task_id = ?",
    [taskId]
  );

  const currentTask = taskRows[0];
  const currentState = currentTask?.Task_state;

  if (currentState !== "Doing") {
    return res.status(400).json({ msgCode: MsgCode.INVALID_STATE_CHANGE });
  }

  const [permit] = await db.query(
    `SELECT COUNT(*) AS count
     FROM usergroup ug
     JOIN application a ON ug.user_group = a.App_permit_Doing
     WHERE ug.username = ?;`,
    [username]
  );

  const permitCount = permit[0].count;

  if (permitCount === 0) {
    return res.status(403).json({ msgCode: MsgCode.NOT_AUTHORIZED });
  }

  const Task_owner = username;
  const noteDate = new Date().toLocaleDateString();
  const noteTime = new Date().toLocaleTimeString();
  const newState = "Done";
  let formattedNote = `[Creator: ${Task_owner}, Date: ${noteDate}, Time: ${noteTime}, State: ${newState}]`;

  const combinedNotes = taskNotes
    ? `${taskNotes}\n${formattedNote}`
    : formattedNote;

  if (combinedNotes.length > 2 ** 24 - 1) {
    res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
    return;
  }

  try {
    const updateQuery = `UPDATE task SET Task_state = ?, Task_notes = ?, Task_owner = ? WHERE Task_id = ?`;
    const [updateResults] = await db.query(updateQuery, [
      newState,
      combinedNotes,
      Task_owner,
      taskId,
    ]);

    if (updateResults.affectedRows === 0) {
      return res.status(404).json({ msgCode: MsgCode.NOT_FOUND });
    }

    const fetchUpdatedTaskQuery = `SELECT * FROM task WHERE Task_id = ?`;
    const [updatedTaskRows] = await db.query(fetchUpdatedTaskQuery, [taskId]);

    const emailQuery =
      "SELECT accounts.email from accounts JOIN usergroup ON usergroup.username = accounts.username JOIN application ON usergroup.user_group = application.App_permit_Done WHERE App_Acronym = ?";
    const [results] = await db.query(emailQuery, [appAcronym]);

    const emails = results
      .map((obj) => obj.email)
      .filter((email) => email)
      .join(", ");

    sendEmail(emails);

    res.status(200).json({
      results: {
        Task_id: taskId,
        Task_state: newState,
      },
      msgCode: MsgCode.SUCCESS,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msgCode: MsgCode.INTERNAL });
  }
});

module.exports = router;

// API 2
// curl -Method POST `
// -Uri "http://localhost:3000/api/demo/GetTaskByState" `
// -Headers @{"Content-Type" = "application/json"} `
// -Body '{"username": "admin","password": "Jing123!","taskState": "2134","appAcronym": "HEY"}'

// API 3
// curl -Method POST `
// -Uri "http://localhost:3000/api/demo/PromoteTask2Done" `
// -Headers @{"Content-Type" = "application/json"} `
// -Body '{ "username": "admin",  "password": "Jing123!","taskId": "HEY_36","appAcronym": "HEY","taskNotes": "Update note for the task"
// }'
