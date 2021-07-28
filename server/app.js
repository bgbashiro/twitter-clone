const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const sqlite = require('sqlite3').verbose()
db = new sqlite.Database('mytwitter.db')

const cookieparser = require('cookie-parser')
app.use(cookieparser())

app.use(express.json())
app.use(express.urlencoded())
app.use("/", express.static("frontend"))

app.post("/api/v1/login", (req, res) => {
  console.log(req.body.username)
  username2userid(req.body.username, (userid) => {
    res.cookie("userid", userid, { httpOnly: false })
    res.redirect("/home.html")
  })
})

app.post("/api/v1/logout", (req, res) => {
  res.clearCookie("userid")
  res.redirect("/home.html")
})

app.post("/api/v1/newuser", (req, res) => {
  db.run(`
  INSERT INTO user (username, fullname, bio)
  VALUES ($username, $fullname, $bio)
  `, {
    $username: req.body.username,
    $fullname: req.body.fullname,
    $bio: req.body.bio
  })
  username2userid(req.body.username, (userid) => {
    res.cookie("userid", userid)
    res.redirect("/home.html")
  })
})

// Use following function to make queries using username
// instead of userid
function username2userid(username, callback) {
  db.get(`
  SELECT rowid FROM user WHERE username is $username
  `, {
    "$username": username
  }, (err, row) => {
    callback(row.rowid)
  })
}

app.get("/api/v1/uid/:username", (req, res) => {
  $username = req.params.username
  db.get(`
  SELECT rowid FROM user WHERE username IS $username
  `, { $username }, (err, row) => {
    console.log(row)
    res.json(row)
  })
})

app.get("/api/v1/u/:username", (req, res) => {
  username2userid(req.params.username, (userid) => {
    console.log(userid)
      // Q: we do not really wanta username do we
    db.all(`
    SELECT content,username FROM tweet
    LEFT JOIN user ON tweet.userid=user.rowid
    WHERE userid IS $userid
    `, { "$userid": userid }, (err, rows) => {
      res.json(rows)
    })
  })
})

app.get("/api/v1/timeline", (req, res) => {

  // !TODO this part is utter shit, use proper authorization
  let $userid = req.cookies.userid
  if (!$userid) {
    res.set(403)
    res.send("User not logged in")
  }

  db.all(`
    SELECT content, username, userid, fullname,tweetdate FROM tweet
    LEFT JOIN user ON tweet.userid=user.rowid
    WHERE userid IN (SELECT followingid FROM follow WHERE followerid=$userid) OR userid IS $userid
    ORDER BY tweetdate DESC
  `, {
    $userid
  }, (err, rows) => {
    res.json(rows)
  })
})

app.post('/api/v1/newtweet', (req, res) => {
  let $userid = req.cookies.userid
  let $tweettext = req.body.tweettext
  if ((!$userid) | (!$tweettext)) {
    res.send("Wrong request format")
  } else {
    db.run(`
      INSERT INTO tweet (content, userid, tweetdate)
      VALUES ( $tweettext, $userid, datetime('now') )
      `, {
      $tweettext,
      $userid
    }, (err) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect("/home.html")
      }
    })
  }
})

app.post("/api/v1/follow", (req, res) => {
  let $followerid = Number(req.body.followerid)
  let $followingid = Number(req.body.followingid)
  let queryparams = {
    $followingid,
    $followerid
  }
  console.log(queryparams)
  db.run(`
    INSERT INTO follow (followerid, followingid)
    VALUES ($followerid, $followingid)
    `, queryparams, (err) => {
    if (err) { console.log(err) }
  })
  res.send("SUCCESS")
})

app.get("/api/v1/allusers", (req, res) => {
  db.all(`
    SELECT username  FROM user
  `, (err, rows) => {
    console.log(rows)
    res.json(rows)
  })

})


app.listen(3000)