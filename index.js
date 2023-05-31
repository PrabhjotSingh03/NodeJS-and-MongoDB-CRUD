const express = require("express");
const path = require("path"); //this is included with Node

const app = express(); //creating an Express app
const port = process.env.PORT || "8888";

//MongoDB stuff
const { MongoClient, ObjectId } = require("mongodb");
//const dbUrl = "mongodb://localhost:27017/testdb"; //if "localhost" doesn't work, use "127.0.0.1"
const dbUrl = "mongodb://127.0.0.1:27017/testdb"; //if "localhost" doesn't work, use "127.0.0.1"
const client = new MongoClient(dbUrl);

//set up Express app to use Pug as the template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//set up public folder path for static files
app.use(express.static(path.join(__dirname, "public")));

//the next two lines are to load get/post data in JSON form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", async (request, response) => {
  let links = await getAllLinks();
  //console.log(links);
  response.render("index", { title: "Home", menu: links });
});
app.get("/about", async (request, response) => {
  let links = await getAllLinks();
  response.render("about", { title: "About", menu: links });
});
//ADMIN PAGES
app.get("/admin/menu", async (request, response) => {
  let links = await getAllLinks();
  response.render("menu-list", { title: "Administer Menu", menu: links });
});
app.get("/admin/menu/add", async (request, response) => {
  let links = await getAllLinks();
  response.render("menu-add", { title: "Add menu link", menu: links });
});
//submission path for add post form
app.post("/admin/menu/add/submit", async (request, response) => {
  let wgt = request.body.weight;
  let href = request.body.path;
  let text = request.body.name;
  //new link in JSON form
  let newLink = {
    weight: wgt,
    path: href,
    name: text
  };
  await addLink(newLink);
  response.redirect("/admin/menu");
});
//submission path for delete get form
app.get("/admin/menu/delete", async (request, response) => {
  let id = request.query.linkId;
  await deleteLink(id);
  response.redirect("/admin/menu");
});

//the GET route for "/admin/menu/edit" that will be used for displaying the edit form page
app.get("/admin/menu/edit", async (request, response) => { 
  if (request.query.linkId) { 
    let linkToEdit = await getSingleLink(request.query.linkId); 
    let links = await getLinks(); 
    response.render("menu-edit", { title: "Edit menu link", menu: links, editLink: linkToEdit }); 
  } else { 
    response.redirect("/admin/menu"); 
  } 
});
//retrieve form submission data and update the link in the DB
app.post("/admin/menu/edit/submit", async (request, response) => { 
  let linkId = request.body.linkId; 
  let idFilter = { _id: new ObjectId(linkId) }; 
  let wgt = request.body.weight;
  let href = request.body.path;
  let text = request.body.name;

    let link = { 
      weight: wgt,
      path: href,
      name: text
    }; 
    await editLink(idFilter, link);
    response.redirect("/admin/menu"); 
});

//set up server listening
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

//MONGO HELPER FUNCTIONS
async function connection() {
  db = client.db("testdb");
  return db;
}
async function getAllLinks() {
  db = await connection();
  let results = db.collection("menuLinks").find({}); // find({}) is select all
  res = await results.toArray();
  return res;
}
async function addLink(newLink) {
  db = await connection();
  let status = await db.collection("menuLinks").insertOne(newLink);
  console.log("link added");
}
async function deleteLink(linkId) {
  db = await connection();
  let deleteFilter = { _id: new ObjectId(linkId) };
  let result = await db.collection("menuLinks").deleteOne(deleteFilter);
  if (result.deletedCount == 1) {
    console.log("delete successful");
  }
}
async function getSingleLink(id) { 
  db = await connection(); 
  const editId = { _id: new ObjectId(id) }; 
  const result = await db.collection("menuLinks").findOne(editId); 
  return result; 
}
//function to retrieve a single document from menuLinks by _id
async function editLink(filter, link) {
  db = await connection();
  await db.collection("menuLinks").updateOne(filter, { $set: link });
  console.log("link updated");
}
async function getLinks() {
  db = await connection();
  let results = db.collection("menuLinks").find({}); // find({}) is select all
  res = await results.toArray();
  return res;
}