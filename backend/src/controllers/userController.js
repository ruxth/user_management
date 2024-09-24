const db = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const bcrypt = require("bcrypt");

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  return usernameRegex.test(username);
};

const validateEmail = (email) => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,10}$/;
  return passwordRegex.test(password);
};

const validateGroup = (groupname) => {
  const groupRegex = /^[a-zA-Z0-9_]+$/;
  return groupRegex.test(groupname);
};

exports.addUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { username, email, group, password, isActive } = req.body.newUser;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and Password are required" });
    }

    if (username && !validateUsername(username)) {
      return res
        .status(400)
        .json({ message: "Username can only contain alphanumeric characters" });
    }

    if (username.length > 50) {
      return "Username must not exceed 50 characters";
    }

    if (email && !validateEmail(email)) {
      return res
        .status(400)
        .json({ message: "Email must be in this format hello@world.com" });
    }

    if (password && !validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-10 characters long and include letters, numbers, and special characters",
      });
    }

    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Check if the username already exists
    const checkUserQuery = "SELECT * FROM accounts WHERE username = ?";
    const [rows] = await db.query(checkUserQuery, [username]);

    if (rows.length > 0) {
      return res.status(400).json({
        message: "Username already exists, please choose another username",
      });
    }

    // Insert new user account
    const addAccountQuery =
      "INSERT INTO accounts (username, email, password, isActive) VALUES (?, ?, ?, ?)";
    await db.query(addAccountQuery, [
      username.toLowerCase(), // Convert username to lowercase before inserting
      email,
      hashedPassword,
      isActive,
    ]);

    if (group && group.length > 0) {
      // Insert user groups
      const addUserGroupQuery =
        "INSERT INTO usergroup (username, user_group) VALUES (?, ?)";
      const groupInsertPromises = group.map(async (userGroup) => {
        await db.query(addUserGroupQuery, [username, userGroup]);
      });

      await Promise.all(groupInsertPromises);
    }

    res.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getAllAccounts = catchAsyncErrors(async (req, res) => {
  try {
    const query = "SELECT * FROM accounts";
    const [rows] = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getAllUserGroups = catchAsyncErrors(async (req, res) => {
  try {
    const query = "SELECT * FROM usergroup";
    const [rows] = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.updateUser = catchAsyncErrors(async (req, res) => {
  const { username } = req.params;
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  let editUserQuery = "UPDATE accounts SET ";
  const values = [];

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password && !validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be 8-10 characters long and include letters, numbers, and special characters",
    });
  }

  if (email) {
    editUserQuery += "email = ?";
    values.push(email);
  }

  if (password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (email) editUserQuery += ", ";
    editUserQuery += "password = ?";
    values.push(hashedPassword);
  }

  editUserQuery += " WHERE username = ?";
  values.push(username);

  try {
    const [rows] = await db.query(editUserQuery, values);

    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Database error!", error });
  }
});

exports.addGroup = catchAsyncErrors(async (req, res) => {
  const { groupName, username = "" } = req.body;

  if (!groupName) {
    return res.status(400).json({ message: "Group name is required" });
  }

  if (groupName.length > 50) {
    return "Group name must not exceed 50 characters";
  }

  if (groupName && !validateGroup(groupName)) {
    return res.status(400).json({
      message:
        "Group name can only contain alphanumeric and underscore characters",
    });
  }

  try {
    const checkQuery = "SELECT * FROM usergroup WHERE user_group = ?";
    const [checkRows] = await db.query(checkQuery, [groupName]);

    if (checkRows.length > 0) {
      return res.status(409).json({ message: "Group name already exists" });
    }

    const query = "INSERT INTO usergroup (username, user_group) VALUES (?, ?)";
    const values = [username || "", groupName];
    const [result] = await db.query(query, values);

    res.status(200).json({ message: "Group added successfully!" });
  } catch (error) {
    console.error("Error adding user groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.editUser = catchAsyncErrors(async (req, res) => {
  const { username } = req.params;
  const { email, password, isActive, group } = req.body.editedUser;
  const getUserQuery = "SELECT * FROM accounts WHERE username = ?";

  if (!email && !password && !group) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  let editUserQuery = "UPDATE accounts SET ";
  const values = [];

  if (email) {
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ message: "mail must be in this format hello@world.com" });
    } else {
      editUserQuery += "email = ?";
      values.push(email);
    }
  }

  if (password && password.trim().length > 0) {
    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-10 characters long and include letters, numbers, and special characters",
      });
    } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      if (email) editUserQuery += ", ";
      editUserQuery += "password = ?";
      values.push(hashedPassword);
    }
  }

  if (isActive) {
    if (email || password) editUserQuery += ", ";
    editUserQuery += "isActive = ?";
    values.push(isActive);
  }

  editUserQuery += " WHERE username = ?";
  values.push(username);

  if (values.length > 1) {
    try {
      const [result] = await db.query(editUserQuery, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found!" });
      }

      const [updatedRows] = await db.query(getUserQuery, [username]);
      const updatedData = updatedRows[0];
    } catch (error) {
      return res.status(500).json({ message: "Database error!", error });
    }
  }

  if (group) {
    try {
      const existingGroupsQuery =
        "SELECT user_group FROM usergroup WHERE username = ?";
      const [existingGroupsRows] = await db.query(existingGroupsQuery, [
        username,
      ]);

      const existingGroups = existingGroupsRows.map((row) => row.user_group);

      const newGroups = group.filter(
        (userGroup) => !existingGroups.includes(userGroup)
      );

      const groupsToDelete = existingGroups.filter(
        (existingGroup) => !group.includes(existingGroup)
      );

      if (newGroups.length > 0) {
        const groupInsertPromises = newGroups.map((userGroup) => {
          return db
            .query(
              "INSERT INTO usergroup (username, user_group) VALUES (?, ?)",
              [username, userGroup]
            )
            .catch((error) => {
              if (error.code === "ER_DUP_ENTRY") {
                return; // Ignore duplicate entries
              } else {
                throw error; // Other errors
              }
            });
        });

        await Promise.all(groupInsertPromises);
      }

      if (groupsToDelete.length > 0) {
        const groupDeletePromises = groupsToDelete.map((userGroup) => {
          return db.query(
            "DELETE FROM usergroup WHERE username = ? AND user_group = ?",
            [username, userGroup]
          );
        });

        await Promise.all(groupDeletePromises);
      }

      res.status(200).json({ message: "User edited successfully!" });
    } catch (error) {
      console.log(error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Database error while editing groups",
          error,
        });
      }
    }
  } else {
    res.status(200).json({ message: "User edited successfully!" });
  }
});
