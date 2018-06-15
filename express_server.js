// Setting up necessary node modules
const express = require("express");
const cookieSession = require('cookie-session')
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

// Make public folder accessible
app.use(express.static('public'));

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({extended: true}));

// Cookies for User ID
app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],

   // Cookie Options
  maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
}))
// Use EJS Templating Engine
app.set("view engine", "ejs");


// SIMULATED DATABASES

// User database
const userList = {

  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
    urlList: { "b2xVn2": "http://www.lighthouselabs.ca"}
  },


 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
    urlList: {}
  }
}

// URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// FUNCTIONS

// Get urls for user given User ID
function urlsForUser(id) {
  return userList[id].urlList;
}

// Generate random 6 digit alphanumeric string, used for User ID and Shortform URL
function generateRandomString() {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charsLength = chars.length;
    var a = [];
    for (var i = 0; i < 6; i++) {
      a.push( chars.charAt(Math.floor(Math.random() * charsLength)) );
    }
    return a.join('');
}

// ROUTES

// Redirect root route to URLs page if logged in or Log In page if not
app.get("/", (req, res) => {
  // Create template variables pointing to url database and user databse,
  // and create user template variable
  let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  if (req.session.user_ID) {
    templateVars.user = userList[req.session.user_id];
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// View urls route
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  // If a user cookie is found, set the user variable to the `user_id` cookie,
  // and point the `urls` variable to the user's own URL list
  if (req.session.user_id) {
    templateVars.user = userList[req.session.user_id];
    templateVars.urls = urlsForUser(req.session.user_id);
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send("403 Need to be logged in");
  }
});

// Creating a new short URL when a long URL is submitted
app.post("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  // If user is logged in
  if (req.session.user_id) {
    templateVars.user = userList[req.session.user_id];
    // Setting short URL to a random 6 digit alphanumeric string
    let shortURL = generateRandomString();
    // Creating a key(short URL)-value(long URL) pair in user's URL list
    userList[req.session.user_id].urlList[shortURL] = req.body.longURL;
    // Creating a key(short URL)-value(long URL) pair in URL database
    urlDatabase[shortURL] = req.body.longURL;
    // Redirect to URLs index
    res.redirect(`/urls`);
  } else {
    res.status(403).send("403 Need to be logged in");
  }
});

// Deleting a URL
app.delete("/urls/:id/delete", (req, res) => {
    let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  // Validating user is signed in and was the creator of the URL they are trying to delete
  if (req.session.user_id && userList[req.session.user_id].urlList[req.params.id]) {
    templateVars.user = userList[req.session.user_id];
    // Delete URL key-value pair in the URL database
    delete urlDatabase[req.params.id];
    // Delete URL key-value pair in the user's URL list
    delete userList[req.session.user_id].urlList[req.params.id];
    // Redirect to URLs index
    res.redirect(`/urls`);
  } else if (!req.session.user_id) {
    res.status(403).send("403 Need to be logged in");
  }
});

// Editing a URL
app.put("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  // Validating user is signed in and was the creator of the URL they are trying to update
  if (req.session.user_id && userList[req.session.user_id].urlList.hasOwnProperty(req.params.id)) {
    templateVars.user = userList[req.session.user_id];
    // Update URL key-value pair in the URL database
    urlDatabase[req.params.id] = req.body.longURL;
    // Update URL key-value pair in the user's URL list
    userList[req.session.user_id].urlList[req.params.id] = req.body.longURL;
    // Redirect to URLs index
    res.redirect("/urls");
  } else if (!req.session.user_id) {
    res.status(403).send("403 Need to be logged in");
  }
});

// View 'new URL' page
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       users: userList,
                       user: undefined};
  // If user is logged in
  if (req.session.user_id) {
    // Set user template variable to  logged in user
    templateVars.user = userList[req.session.user_id];
    // Render the page
    res.render("urls_new", templateVars);
  } else {
    // If not logged in, show login page
    res.redirect('/login');
  }
});

// View URL page by ID
app.get("/urls/:id", (req, res) => {
  // Create template variables for user, short URL (point to ID in path),
  // long URL (point to value in DB where ID in path is)
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: undefined
                      };
  // If correct user is logged in
  if (req.session.user_id) {
    // Set user template variable to logged in user
    templateVars.user = userList[req.session.user_id];
    // Render URL page
    if (userList[req.session.user_id].urlList[req.params.id]) {
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send("403 Not your link");
    }
  } else {
    // If correct user not logged in, show URLs page
    res.status(403).send("403 Need to be logged in");
  }
});



// Go to website from short URL
app.get("/u/:shorty", (req, res) => {
    let longURL = urlDatabase[req.params.shorty];
    res.redirect(longURL);
});

  // If logged in redirect to URLs index otherwise show register page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  } else {
    let templateVars = { users: userList};
    res.render('registration', templateVars);
  }
})

  // If logged in redirect to URLs index otherwise show login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls')
  } else {
    let templateVars = { users: userList};
    res.render('login', templateVars);
  }
})

// Receive register form
app.post("/register", (req, res) => {
  let templateVars = { users: userList}
  let emailArray = [];
  let found = false;
  // Check if e-mail is already in use
  for (let user in userList) {
    found = (req.body.email === userList[user].email)
  }
  // If email isn't in use and e-mail and password are entered, submit form
  if (req.body.email && req.body.password && !found) {
    let userID = generateRandomString();
    userList[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      urlList: {}
    }
    req.session.user_id = userList[userID].id;
    res.redirect('/urls');
  } else if (emailArray.includes(req.body.email)) {
    res.status(400).send("400 There is already an account with this email");
    } else {
    res.status(400).send("400 Email and Password need to be filled");
    }
  })

//  Receive login form
app.post("/login", (req, res) => {
  let templateVars = { users: userList}
  let match = false;
  let found = false;
  // Check if email is associated with account
  for (let user in userList) {
    if (req.body.email === userList[user].email) {
      found = userList[user];
    }
    // Check if passwords match
    match = (bcrypt.compareSync(req.body.password, userList[user].password));
  }
  // If email is found and password matches, log user in
  if (found) {
    if (match) {
      res.session.user_id = found.id;
      res.redirect('/urls');
    } else {
      res.status(403).send("403 Password is incorrect")
    }
  } else {
    res.status(403).send("403 Email not found");
    }
  });

// Logging out
app.post("/logout", (req, res) => {
  // Delete cookie session
  req.session = null;
  // Redirect to root
  res.redirect('/');
})

// Starting server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});