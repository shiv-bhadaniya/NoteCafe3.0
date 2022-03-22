const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
let alert = require('alert');
const bcrypt = require("bcrypt");

const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("URL", {useNewUrlParser: true});

const Registration = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model("User", Registration);

var currentUser = null;

if(!currentUser) {
  console.log("currentUser: ",currentUser);
}
else{
  console.log("currentUser is null");

}

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "There is a no item plase add"
});



const defaultItems = [item1];

const listSchema = {
  name: String,
  creator: String,
  items: [itemsSchema],

};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  alert("Click on noteCafe to Sign in");
  res.sendFile(__dirname + "/HTML/index.html");
});

app.get("/text", function(req, res) {
  res.sendFile(__dirname + "/HTML/text.html");
});

app.get("/chat", function(req, res) {
  res.sendFile(__dirname + "/HTML/chat.html");
})

app.get("/signin", function (req, res) {
  res.sendFile(__dirname + "/HTML/signin.html");
});

app.get("/signup", function (req, res) {
  res.sendFile(__dirname + "/HTML/signup.html");
});

app.get("/todo", function(req, res) {

  List.find({creator: currentUser._id}, function(err, foundList){

    if (foundList.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      // res.redirect("/todo");
      res.render("todoList", {listTitle: "List of todos", newListItems: foundList});
    } else {
      res.render("todoList", {listTitle: "List of todos", newListItems: foundList});
    }
  });

});

app.get("/todo/:customListName", function(req, res){
  console.log(`app.get("/todo/:customListName")`);
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          creator: currentUser._id,
          items: defaultItems,
        });
        list.save();
        res.redirect("/todo/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

app.post("/todo", function(req, res){
  console.log(`Enter app.post("/todo")`);
  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName,
  });

  if (listName === "Today"){
    item.save();

    res.redirect("/todo/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/todo/" + listName);
    });
  }
});

app.post("/todo/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/todo/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/todo/" + listName);
      }
    });
  }


});

app.post("/todoadd", function(req,res) {

  let name = req.body.newItem;
  console.log("name : ", name);
  console.log(`/todoadd`);
  res.redirect("/todo/" + name);
})






app.post("/signup", function (req, res) {
  User.findOne({ email: req.body.email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser && res.status(200)) {
        console.log("Already exsist");
        res.redirect("/signin");
      } else {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
          const Email_id = req.body.email;
          const Password = hash;
          const Confirm_Password = hash;
          const newUser = new User({
            email: Email_id,
            password: Password,
            confirm_password: Confirm_Password,
          });
          currentUser = newUser;
          console.log("New User: ", currentUser);
          newUser.save((err) => {
            if (err) {
              console.log(err.message);
            } else {
              console.log("New User Sucessfully Added");
              res.redirect("/todo");
            }
          });
        });
      }
    }
  });
});

app.post("/signin", function (req, res) {

  signinCall();

  async function signinCall() {
    const { email, password } = req.body;
    console.log(email, password);
try {

  const existingUser = await User.findOne( { email } );
  console.log(existingUser);

  if(existingUser) {
    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if(isPasswordCorrect) {
      currentUser = existingUser;
      console.log("currentUser : ", currentUser);
      res.redirect("/todo");
    } else {
      alert("Something went wrong");
      res.redirect("/signin");
    }
  }

} catch (error) {
  res.redirect("/signup");
}

  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
