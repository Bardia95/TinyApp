const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");


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
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

function urlsForUser(id) {
  return userList[id].urlList;
}


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
                       users: userList,
                       user: undefined};
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']];
    templateVars.urls = urlsForUser(req.cookies['user_id']);
  }
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  userList[req.cookies['user_id']].urlList[shortURL] = req.body.longURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies['user_id'] && userList[req.cookies['user_id']].urlList[req.params.id]) {
    console.log("in if")
    delete urlDatabase[req.params.id];
    delete userList[req.cookies['user_id']].urlList[req.params.id];
    res.redirect(`/urls`);
  }
});

app.post("/urls/:id", (req, res) => {
  if (req.cookies['user_id'] && userList[req.cookies['user_id']].urlList.hasOwnProperty(req.params.id)) {
    urlDatabase[req.params.id] = req.body.longURL;
    userList[req.cookies['user_id']].urlList[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  };
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: undefined
  };
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']];
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: undefined
                      };
  if (req.cookies['user_id']) {
    templateVars.user = userList[req.cookies['user_id']];
    res.render("urls_show", templateVars);
  } else {
    res.redirect('/urls');
  }
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
  let found = false;
  for (let user in userList) {
    found = (req.body.email === userList[user].email)
  }
  if (req.body.email && req.body.password && !found) {
    let userID = generateRandomString();
    userList[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      urlList: {}
    }
    res.cookie('user_id', userList[userID].id);
    res.redirect('/urls');
  } else if (emailArray.includes(req.body.email)) {
    res.status(400).send("400 There is already an account with this email");
    } else {
    res.status(400).send("400 Email and Password need to be filled");
    }
  })

app.post("/login", (req, res) => {
  let templateVars = { users: userList}
  let match = false;
  let found = false;
  for (let user in userList) {
    if (req.body.email === userList[user].email) {
      found = userList[user];
    }
    match = (bcrypt.compareSync(req.body.password, userList[user].password));
  }
  if (found) {
    if (match) {
      res.cookie('user_id', found.id);
      res.redirect('/urls');
    } else {
      res.status(403).send("403 Password is incorrect")
    }
  } else {
    res.status(403).send("403 Email not found");
    }
  });

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});