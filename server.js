const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static("assets"));

// npm install express-session

const session = require("express-session");
app.use(
  session({
    secret: "terrace cat", // any random string used for configuring the session
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
  })
);

//npm install --save multer
const multer = require("multer");
const myStorage = multer.diskStorage({
  destination: "./assets/image/deliveredPhotos/",
  filename: function (req, file, cb) {
    cb(null, `${req.params.id}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage: myStorage });
app.use(express.static("./public/"));

//npm install express-handlebars
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

//npm install mongoose
const mongoose = require("mongoose");
const fs = require("fs");
const { log } = require("console");
const { listenerCount } = require("process");

const CONNECTION_STRING =
  "mongodb+srv://dbUser:123123123@cluster0.xtldzp8.mongodb.net/restaurant?retryWrites=true&w=majority";
mongoose.connect(CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});
const Schema = mongoose.Schema;

// model

//Product Model
const Product = new Schema({
  product: String,
  prices: {
    Small: Number,
    Medium: Number,
    Large: Number,
    "Extra Large": Number,
  },
  description: String,
  ingredients: [String],
  vegetarian: Boolean,
  image_url: String,
});
const product = mongoose.model("product", Product);
let itemForCart = null;

// Toppings Model
const Toppings = new Schema({
  name: String,
  price: Number,
});
const topping = mongoose.model("topping", Toppings);

// OrderDetail Model

const OrderDetail = new Schema({
  orderId: String,
  productId: String,
  items: Number,
});
const orderDetail = mongoose.model("orderDetail", OrderDetail);

// Order Model
const Order = new Schema({
  status: {
    type: String,
    enum: ["RECEIVED", "READY FOR DELIVERY", "IN TRANSIT", "DELIVERED"],
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  driver: {
    _id: String,
    name: String,
    userId: String,
    password: String,
    licensePlate: String,
    vehicleModel: String,
    color: String,
    address: String,
    role: {
      type: String,
      enum: ["RESTAURANT", "DRIVER", "CUSTOMER"],
      required: true,
    }
  },
  deliveredPhoto: String,
  orderItems: [
    {
      productName: String,
      quantity: Number,
      price: Number,
    },
  ],
  orderItemsCount: {
    type: Number,
    default: 0,
  },
  orderTotal: {
    type: Number,
    default: 0,
  },
});

const order = mongoose.model("order", Order);

// User
const User = new Schema({
  name: String,
  userId: String,
  password: String,
  licensePlate: String,
  vehicleModel: String,
  color: String,
  address: String,
  role: {
    type: String,
    enum: ["RESTAURANT", "DRIVER", "CUSTOMER"],
    required: true,
  },
});

const user = mongoose.model("user", User);

//method

//check null / undefined / empty string
const checkStatus = (str) => {
  if (str === "" || str === undefined || str === null) {
    return true;
  } else {
    return false;
  }
};

//ensureLogin
const ensureLogin = (req, res, next) => {
  if (
    ((req.session.isDriver !== undefined && req.session.isDriver === true) ||
      (req.session.isRestaurant !== undefined && req.session.isRestaurant === true)) &&
    req.session.user !== undefined
  ) {
    // if user has logged in allow them to go to desired endpoint
    next();
  } else {
    return res.redirect("/login");
  }
};

//createOrderList
const createOrderList = async (orderId) => {
  let amount = 0;
  try {
    const orderFromDb = await order.findOne({ _id: orderId }).lean().exec();
    const orderDetails = await orderDetail
      .find({ orderId: orderId })
      .lean()
      .exec();
    const orderInfos = [];
    for (const orderDetail of orderDetails) {
      const productFromDb = await product
        .findOne({ _id: orderDetail.productId })
        .lean()
        .exec();
      const orderInfo = {
        productName: productFromDb.product,
        productPrice: productFromDb.prices.Medium,
        orderItems: orderDetail.items,
        orderDetailId: orderDetail._id,
      };
      orderInfos.push(orderInfo);
      amount += productFromDb.prices.Medium;
    }

    const tax = parseFloat((amount * 0.13).toFixed(2));
    const totalAmount = (amount + tax).toFixed(2);
    const orderList = {
      order: orderFromDb,
      orderInfos: orderInfos,
      amount: amount,
      tax: tax,
      totalAmount: totalAmount,
    };
    if (orderFromDb.status === 3 || orderFromDb.status === 4) {
      const driverFromDb = await user.findOne({ _id: orderFromDb.driverId });
      if (driverFromDb === null) {
        console.log(`Can't Find driver. _id:${orderFromDb.driverId}`);
      }
      orderList.driverName = driverFromDb.name;
    }

    switch (orderFromDb.status) {
      case -1:
        orderList.isCanceled = true;
        break;
      case 0:
        orderList.isInCart = true;
        break;
      case 1:
        orderList.isReceived = true;
        break;
      case 2:
        orderList.isReady = true;
        break;
      case 3:
        orderList.isTransit = true;
        break;
      case 4:
        orderList.isDelivered = true;
        break;
      default:
        break;
    }
    return orderList;
  } catch (error) {
    console.log(error);
  }
};


app.get("/", async (req, res) => {
  try {
    const paneerPizza = await product
      .find({ product: "Paneer Pizza" })
      .lean()
      .exec();
    const supremePizza = await product
      .find({ product: "Supreme Pizza" })
      .lean()
      .exec();
    const buildYourOwnPizza = await product
      .find({ product: "Build Your Own Pizza" })
      .lean()
      .exec();

    const featuredItem = paneerPizza.concat(supremePizza, buildYourOwnPizza);

    return res.render("index", {
      layout: "layout",
      featuredItem: featuredItem,
      isDriver: req.session.isDriver,
      isRestaurant: req.session.isRestaurant,
      isCustomer: req.session.isCustomer,
    });
  } catch {
    console.log(error);
    return res.redirect("/");
  }
});

//menu
app.get("/Menu", async (req, res) => {
  try {
    const menuList = await product.find().lean().exec();
    const toppings = await topping.find().lean().exec();

    if (itemForCart !== null) {
      item = itemForCart;
      itemForCart = null;

      return res.render("menu", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
        isCustomer: req.session.isCustomer,
        menuList: menuList,
        item,
        toppings,
      });
    }

    return res.render("menu", {
      layout: "layout",
      isDriver: req.session.isDriver,
      isRestaurant: req.session.isRestaurant,
      isCustomer: req.session.isCustomer,
      menuList: menuList,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/Add-to-cart/:id", async (req, res) => {
  try {
    itemForCart = await product.findOne({ _id: req.params.id }).lean().exec();
    return res.redirect("/Menu");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

// Order History
app.get("/Order-history", async (req, res) => {
  try {
    const orderFromDb = await order.findOne({ status: 0 }).lean().exec();

    if (orderFromDb !== null) {
      const pendingOrder = await createOrderList(orderFromDb._id);
      return res.render("Order-history", {
        layout: "layout",
        isLoggedIn: req.session.isLoggedIn,
        orderList: pendingOrder,
      });
    } else {
      return res.render("Order-history", {
        layout: "layout",
        isLoggedIn: req.session.isLoggedIn,
        orderList: "",
      });
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/AddOrder/:id", async (req, res) => {
  try {
    //find Order
    let orderFromDb = await order.findOne({ status: 0 }).lean().exec();
    if (orderFromDb === null) {
      const newOrder = new order({
        status: 0,
      });
      orderFromDb = await newOrder.save();
    }
    //find product to add
    const item = await product.findOne({ _id: req.params.id }).lean().exec();
    // find OrderDetail check has same item.
    const orderDetailFromDb = await orderDetail.findOne({
      productId: req.params.id,
      orderId: orderFromDb._id,
    });
    if (orderDetailFromDb === null) {
      //add OrderDetail
      const newOrderDetail = new orderDetail({
        orderId: orderFromDb._id,
        productId: item._id,
        items: 1,
      });
      await newOrderDetail.save();
    } else {
      console.log("Item has been added");
    }
    return res.redirect("/Menu");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/DelItem/:id", async (req, res) => {
  try {
    //find orderDetail
    const orderDetailFromDb = await orderDetail.findOne({ _id: req.params.id });
    const orderId = orderDetailFromDb.orderId;
    await orderDetailFromDb.deleteOne();

    //if orderDetail is empty remove the order
    const orderDetails = await orderDetail
      .find({ orderId: orderId })
      .lean()
      .exec();
    if (orderDetails.length === 0) {
      const orderFromDb = await order.findOne({ _id: orderId });
      orderFromDb.deleteOne();
    }
    return res.redirect("/Menu");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/SubmitOrder/:id", async (req, res) => {
  try {
    const orderFromDb = await order.findOne({ _id: req.params.id });
    if (orderFromDb === null) {
      console.log(`Order Id ${req.params.id} not found`);
    }
    const updatedValues = {
      status: 1,
      orderDate: new Date(),
    };
    const result = await orderFromDb.updateOne(updatedValues);
    return res.redirect("/Order");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

// order
app.get("/order", async (req, res) => {
  try {
    const allOrders = await order.find().sort({ orderDate: -1 }).lean().exec();
    let orderHistory = [];
    let currentOrders = [];
    let searchResults = [];
    let showSearchResults = false;

    orderHistory = allOrders.filter((order) => order.status === "DELIVERED");
    currentOrders = allOrders.filter((order) => order.status !== "DELIVERED");

    // search by customer name
    if (req.query.customerName) {
      const customerName = req.query.customerName;
      searchResults = allOrders.filter((order) => order.customerName === customerName);
      showSearchResults = true;
    } else {
      if (req.query.customerName === "") {
        searchResults = [];
        showSearchResults = true;
      } else {
        showSearchResults = false;
      }
    }

    res.render("order", {
      layout: "layout",
      isLoggedIn: req.session.isLoggedIn,
      allOrders: allOrders,
      orderHistory: orderHistory,
      currentOrders: currentOrders,
      showSearchResults: showSearchResults,
      searchResults: searchResults,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

app.get("/order/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const orderInfo = await order.findOne({ _id: orderId }).lean().exec();

    res.render("orderDetail", {
      layout: "layout",
      isDriver: req.session.isDriver,
      isRestaurant: req.session.isRestaurant,
      isCustomer: req.session.isCustomer,
      orderInfo: orderInfo,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// cancel order
app.post("/cancelOrder/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderFromDb = await order.findOne({ _id: orderId });

    if (orderFromDb === null) {
      console.log(`Order Id ${orderId} not found`);
      return res.redirect("/order");
    }

    const updatedValues = {
      status: "CANCELED",
    };
    await orderFromDb.updateOne(updatedValues);

    return res.redirect("/order");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

//driver
app.get("/Driver", ensureLogin, async (req, res) => {
  try {
    const statusesToFind = ["READY FOR DELIVERY", "IN TRANSIT"];
    const orderFromDb = await order
      .find({ status: { $in: statusesToFind } })
      .lean()
      .exec();

    if (orderFromDb.length !== 0) {
      const orderList = [];
      for (const order of orderFromDb) {

        if (order.status === "READY FOR DELIVERY" || (order.status === "IN TRANSIT" && order.driver._id === req.session.user._id)

        ) {
          orderList.push(await createOrderList(order._id));
        }
      }

      //split status to two list
      const readyDelivery = [];
      const inTransit = [];
      for (const order of orderList) {
        if (order.order.status === "READY FOR DELIVERY") {
          readyDelivery.push(order);
        } else {
          inTransit.push(order);
        }
      }
      return res.render("driver", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
        readyDelivery: readyDelivery,
        inTransit: inTransit,
      });
    } else {
      return res.render("driver", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
      });
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/PickOrder/:id", ensureLogin, async (req, res) => {
  try {
    console.log(req.params.id);

    const orderFromDb = await order.findOne({ _id: req.params.id });
    const updatedValues = {
      status: "IN TRANSIT",
      driver: req.session.user,
    };
    await orderFromDb.updateOne(updatedValues);
    return res.redirect("/Driver");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/Delivered/:id", ensureLogin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderList = await createOrderList(orderId);
    return res.render("delivered", {
      layout: "layout",
      orderList: orderList,
      isDriver: req.session.isDriver,
      isRestaurant: req.session.isRestaurant,
      isCustomer: req.session.isCustomer,
      jsName: "delivered.js",
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.post("/Delivered/:id", upload.single("photo"), async (req, res) => {
  try {
    const orderFromDb = await order.findOne({ _id: req.params.id });
    if (req.file === undefined) {
      console.log(`photo not provided with form data`);
      return res.render("delivered", {
        layout: "layout",
        orderList: await createOrderList(orderFromDb._id),
        ErrorMsg: "No Photo.",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
      });
    }
    const formFile = req.file;

    const updatedValues = {
      status: "DELIVERED",
      deliveredPhoto: formFile.filename,
    };
    await orderFromDb.updateOne(updatedValues);
    return res.redirect("/Driver");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});


app.get('/DriverHistory', async (req, res) => {
  try {
    const history = await order.find({ 'driver._id': req.session.user._id, status: "DELIVERED" }).lean().exec();
    console.log(history);
    return res.render("driverHistory", {
      layout: "layout",
      isDriver: req.session.isDriver,
      isRestaurant: req.session.isRestaurant,
      isCustomer: req.session.isCustomer,
      history: history,
    })
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

//Login /SignUp

app.get("/Login", (req, res) => {
  return res.render("login", {
    layout: "layout",
    isDriver: req.session.isDriver,
    isRestaurant: req.session.isRestaurant,
    isCustomer: req.session.isCustomer,
    cssName: "login-style.css",
  });
});

app.post("/Login", async (req, res) => {
  try {
    if (!req.session.isDriver) {
      const userId = req.body.userId;
      const password = req.body.password;
      if (checkStatus(userId) || checkStatus(password)) {
        return res.render("login", {
          layout: "layout",
          isDriver: req.session.isDriver,
          isRestaurant: req.session.isRestaurant,
          isCustomer: req.session.isCustomer,
          ErrorMsg: "User Id / Password is empty",
          cssName: "login-style.css",
        });
      }
      const userFromDb = await user.findOne({ userId: userId }).lean().exec();
      if (userFromDb === null) {
        return res.render("login", {
          layout: "layout",
          isDriver: req.session.isDriver,
          isRestaurant: req.session.isRestaurant,
          isCustomer: req.session.isCustomer,
          ErrorMsg: "User Id / Password is Error",
          cssName: "login-style.css",
        });
      }

      if (password !== userFromDb.password) {
        return res.render("login", {
          layout: "layout",
          isDriver: req.session.isDriver,
          isRestaurant: req.session.isRestaurant,
          isCustomer: req.session.isCustomer,
          ErrorMsg: "User Id / Password is Error",
          cssName: "login-style.css",
        });
      }
      req.session.user = userFromDb;
      if (userFromDb.role === "RESTAURANT") {
        req.session.isRestaurant = true;
        return res.redirect("/Order");
      }
      if (userFromDb.role === "DRIVER") {
        req.session.isDriver = true;
        return res.redirect("/Driver");
      }
      if (userFromDb.role === "CUSTOMER") {
        console.log();
        req.session.isCustomer = true;
        return res.redirect("/Menu")
      }
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/SignUp", (req, res) => {
  return res.render("signUp", {
    layout: "layout",
    isDriver: req.session.isDriver,
    isRestaurant: req.session.isRestaurant,
    isCustomer: req.session.isCustomer,
    cssName: "login-style.css",
    jsName: "signup.js",
  });
});

app.post("/SignUp", async (req, res) => {
  try {
    const userId = req.body.userId;
    const password = req.body.password;
    const name = req.body.name;
    const licensePlate = req.body.licensePlate;
    const phone = req.body.phone;
    const address = req.body.address;
    const userType = req.body.user;
    const vehicleModel = req.body.vehicleModel;
    const color = req.body.color;
    console.log(JSON.stringify(req.body));
    if (checkStatus(userId) || checkStatus(password) || checkStatus(name) || checkStatus(phone)) {
      return res.render("signUp", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
        cssName: "login-style.css",
        ErrorMsg: "Some info are empty",
      });
    }

    if ((userType === "CUSTOMER" && checkStatus(address)) ||
      (userType === "DRIVER" && (checkStatus(licensePlate) || checkStatus(vehicleModel) || checkStatus(color)))) {
      return res.render("signUp", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
        cssName: "login-style.css",
        ErrorMsg: "Some info are empty",
      });
    }

    const userFromDb = await user.find({ userId: userId }).lean().exec();
    if (userFromDb.length !== 0) {
      return res.render("signUp", {
        layout: "layout",
        isDriver: req.session.isDriver,
        isRestaurant: req.session.isRestaurant,
        isCustomer: req.session.isCustomer,
        cssName: "login-style.css",
        ErrorMsg: "UserId has been used.",
      });
    }
    const newUser = new user({
      userId: userId,
      password: password,
      name: name,
      role: userType,
    });
    if (userType === "CUSTOMER") {
      newUser.address = address;
    }
    if (userType === "DRIVER") {
      newUser.licensePlate = licensePlate;
      newUser.vehicleModel = vehicleModel;
      newUser.color = color;
    }
    await newUser.save();
    req.session.user = newUser;
    if (newUser.role === "DRIVER") {
      req.session.isDriver = true;
    }
    if (newUser.role === "CUSTOMER") {
      req.session.isCustomer = true;
    }
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

app.get("/Logout", ensureLogin, (req, res) => {
  req.session.destroy();
  return res.redirect("/");
});

const onHTTPStart = () => {
  console.log(`Server has started. Visit http://localhost:${HTTP_PORT}`);
  console.log(`User Ctrl+C to stop the server`);
};
app.listen(HTTP_PORT, onHTTPStart);