var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");


const userList = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

function generateRandomString() {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charsLength = chars.length;
    var a = [];

    for(var i=0; i<6; i++)
      a.push( chars.charAt(Math.floor(Math.random() * charsLength)) );

    return a.join('');
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: undefined};
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']];
  }
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: undefined
  };
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']]
    res.render("urls_new", templateVars);
  }
  res.redirect('/login');
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: undefined
                      };
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']];
  }
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { users: userList};
  res.render('registration', templateVars);
})

app.get("/login", (req, res) => {
  let templateVars = { users: userList};
  res.render('login', templateVars);
})

app.post("/register", (req, res) => {
  let templateVars = { users: userList}
  let emailArray = [];
  for (let user in userList) {
    emailArray.push(userList[user].email);
  }
  if (req.body.email && req.body.password && !emailArray.includes(req.body.email)) {
    let userID = generateRandomString();
    userList[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie('user_id', userList[userID].id);
    loggedIn = true;
    res.redirect('/urls');
  } else if (emailArray.includes(req.body.email)) {
    res.status(400).send("There is already an account with this email");
    } else {
    res.status(400).send("Email and Password need to be filled");
  }


})

app.post("/login", (req, res) => {
  let templateVars = { users: userList}
  for (let user in userList) {
    if (userList[user].email === req.body.email) {
      if (userList[user].password === req.body.password) {
        res.cookie('user_id', userList[user].id);
        loggedIn = true;
        res.redirect('/urls');
    } else {
      res.status(403).send("Password is incorrect")
    }
  } else {
    res.status(403).send("Email not found");
  }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  loggedIn = false;
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});