const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001;

const { Pool } = require("pg");
const pool = new Pool({
  user: "hakima",
  host: "localhost",
  database: "Afghanistan",
  password: "hakima",
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

let userScore = 0;
let cities = [];
let hintRegion = undefined;
let hintDistrict = "";

pool.query("SELECT * FROM districts", (err, res) => {
  if (err) {
    console.error("Error fetching cities:", err);
  } else {
    cities = res.rows;
    console.log("Cities loaded:", cities);
  }
});

app.get("/", (req, res) => {
  if (cities.length > 0) {
    let randomDistrict;
    if (hintRegion) {
      randomDistrict = hintDistrict;
    } else {
      const randomIndex = Math.floor(Math.random() * cities.length);
      randomDistrict = cities[randomIndex].district;
    }
    res.render("index", { randomDistrict, userScore, hintRegion });
  } else {
    res.send("🤥🤔شهری یافت نشد");
  }
});

app.post("/check", (req, res) => {
  const action = req.body.action;
  const userInput = req.body.cityInput.trim();
  const distract = req.body.district.trim();
  if (action === "check") {
    pool.query(
      "SELECT province FROM districts WHERE LOWER(district) = LOWER($1)",
      [distract],
      (err, result) => {
        if (err) {
          console.error("Error checking district:", err);
          res.status(500).send("خطا *!");
        } else {
          if (result.rows.length > 0) {
            const province = result.rows[0].province;
            hintRegion = undefined;
            if (userInput === province) {
              userScore++;
              res.redirect("/");
            }
            else {
                userScore--;
                 console.log("امتیاز فعلی:", userScore);
                if (userScore < 0) {
                   console.log("رفتن به صفحه gameover"); 
                  res.redirect("/gameover");
              } else {
                res.redirect("/");
              }
            }
          }
        }
      }
    );
  } else if (action === "hint") {
    pool.query(
      "SELECT region FROM districts where district = $1",
      [distract],
      (err, result) => {
        if (err) {
          console.error("Error fetching hint:", err);
          res.status(500).send("خطا در دریافت راهنما");
        } else {
          if (result.rows.length > 0) {
            hintRegion = result.rows[0].region;
            hintDistrict = distract;
            res.redirect("/");
          } else {
            res.send("هیچ راهنمایی یافت نشد");
          }
        }
      }
    );
  }
});

app.get("/gameover", (req, res) => {
    res.render("gameover");
})

app.post("/reset", (req, res) => {
    userScore = 0;
    hintRegion = undefined;
    res.redirect("/"); 
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
