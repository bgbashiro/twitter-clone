let userid = readCookies()["userid"]
let loginform = document.querySelector("#login-form")
let loginformcontainer = document.querySelector("#login-form-container")
let timeline = document.querySelector("#timeline")
let twList = document.querySelector("#timeline > dl")

if (!readCookies()["userid"]) {
  loginformcontainer.classList.add("is-active")
} else {
  fetch(`http://localhost:3000/api/v1/timeline`)
    .then(rows => rows.json())
    .then(rows => {
      rows.forEach((row) => {
        // appendTw(row.username, row.content)
        document.querySelector("#timeline").appendChild(
          mkTweetView(row.username, row.content)
        )
      })
    })
  document.querySelector("#new-tweet-form").appendChild(
    mkNewTweetForm()
  )
}