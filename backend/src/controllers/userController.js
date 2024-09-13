const { connection } = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const bcrypt = require("bcrypt");

const validateEmail = (email) => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,10}$/;
  return passwordRegex.test(password);
};

exports.addUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { username, email, group, password, isActive } = req.body.newUser;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and Password are required" });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
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

    const checkUserQuery = "SELECT * FROM accounts WHERE username = ?";
    connection.query(checkUserQuery, [username], (error, results) => {
      if (error) {
        console.error("Database error (check username):", error);
        return res.status(500).json({ message: "Database error", error });
      }

      if (results.length > 0) {
        return res.status(400).json({
          message: "Username already exists, please choose another username",
        });
      }

      const addAccountQuery =
        "INSERT INTO accounts (username, email, password, isActive) VALUES (?, ?, ?, ?)";
      const addUserGroupQuery =
        "INSERT INTO usergroup (username, user_group) VALUES (?, ?)";

      connection.query(
        addAccountQuery,
        [username, email, hashedPassword, isActive],
        (error, results) => {
          if (error) {
            return res.status(500).json({ message: "Database error", error });
          }

          if (group) {
            const groupInsertPromises = group.map((userGroup) => {
              return new Promise((resolve, reject) => {
                connection.query(
                  addUserGroupQuery,
                  [username, userGroup],
                  (error, results) => {
                    if (error) {
                      console.error("Database error (usergroup):", error);
                      reject(error);
                    } else {
                      resolve(results);
                    }
                  }
                );
              });
            });
            Promise.all(groupInsertPromises)
              .then(() => {
                res.status(200).json({ message: "User added successfully!" });
              })
              .catch((error) => {
                res.status(500).json({ message: "Database error", error });
              });
          } else {
            res.status(200).json({ message: "User added successfully!" });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getAllAccounts = catchAsyncErrors(async (req, res) => {
  try {
    const query = "SELECT * FROM accounts";
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.getAllUserGroups = catchAsyncErrors(async (req, res) => {
  try {
    const query = "SELECT * FROM usergroup";
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Database error (usergroup):", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.updateUser = async (req, res) => {
  const { username } = req.params;
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: "Nothing to save" });
  }

  let sqlUpdateUser = "UPDATE accounts SET ";
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

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  } else {
    sqlUpdateUser += "email = ?";
    values.push(email);
  }

  if (password && !validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be 8-10 characters long and include letters, numbers, and special characters",
    });
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (email) sqlUpdateUser += ", ";
    sqlUpdateUser += "password = ?";
    values.push(hashedPassword);
  }

  sqlUpdateUser += " WHERE username = ?";
  values.push(username);

  connection.query(sqlUpdateUser, values, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Database error!", error });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User updated successfully!" });
  });
};

exports.addGroup = catchAsyncErrors(async (req, res) => {
  const { groupName, username = "" } = req.body;

  if (!groupName) {
    return res.status(400).json({ message: "Group name is required" });
  }

  try {
    const checkQuery = "SELECT * FROM usergroup WHERE user_group = ?";
    connection.query(checkQuery, [groupName], (checkError, checkResult) => {
      if (checkResult.length > 0) {
        return res.status(409).json({ message: "Group name already exists" });
      }

      const query =
        "INSERT INTO usergroup (username, user_group) VALUES (?, ?)";
      const values = [username || "", groupName];

      connection.query(query, values, (error, result) => {
        if (error) {
          console.error("Database error (usergroup):", error);
          return res.status(500).json({ message: "Database error", error });
        }
        res.status(200).json({ message: "Group added successfully!" });
      });
    });
  } catch (error) {
    console.error("Error adding user groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.editUser = catchAsyncErrors(async (req, res) => {
  const { username } = req.params;
  const { email, password, isActive, group } = req.body.editedUser;

  if (!email && !password && !group) {
    return res.status(400).json({ message: "Nothing to save" });
  }

  let sqlUpdateUser = "UPDATE accounts SET ";
  const values = [];

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  } else {
    sqlUpdateUser += "email = ?";
    values.push(email);
  }

  if (password && !validatePassword(password)) {
    console.log();

    return res.status(400).json({
      message:
        "Password must be 8-10 characters long and include letters, numbers, and special characters",
    });
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (email) sqlUpdateUser += ", ";
    sqlUpdateUser += "password = ?";
    values.push(hashedPassword);
  }

  sqlUpdateUser += " WHERE username = ?";
  values.push(username);

  const addUserGroupQuery =
    "INSERT INTO usergroup (username, user_group) VALUES (?, ?)";

  connection.query(sqlUpdateUser, values, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Database error!", error });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (group) {
      const groupInsertPromises = group.map((userGroup) => {
        return new Promise((resolve, reject) => {
          connection.query(
            addUserGroupQuery,
            [username, userGroup],
            (error, results) => {
              if (error) {
                console.error("Database error (usergroup):", error);
                reject(error);
              } else {
                resolve(results);
              }
            }
          );
        });
      });
      Promise.all(groupInsertPromises)
        .then(() => {
          res.status(200).json({ message: "User edited successfully!" });
        })
        .catch((error) => {
          res.status(500).json({ message: "Database error", error });
        });
    } else {
      res.status(200).json({ message: "User edited successfully!" });
    }
  });
});
