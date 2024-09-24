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

  try {
    const addApplicationQuery =
      "INSERT INTO application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const checkAcronymQuery =
      "SELECT COUNT(*) as count FROM application WHERE App_Acronym = ?";
    const [rows] = await db.query(checkAcronymQuery, [App_Acronym]);

    if (rows[0].count > 0) {
      return res.status(400).json({ message: "App_Acronym must be unique." });
    }

    await db.query(addApplicationQuery, [
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

    res.status(200).json({ message: "Application added successfully!" });
  } catch (error) {
    console.error("Error adding application:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
  try {
    const query = "SELECT * FROM application";
    const [rows] = await db.query(query);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getApplication = catchAsyncErrors(async (req, res, next) => {
  console.log("[getApplication]");
  try {
    const { App_Acronym } = req.params;

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
