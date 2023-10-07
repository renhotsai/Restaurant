//npm install express
//npm install nodemon
const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require('path');
app.use(express.urlencoded({
    extended: true
}))
app.use(express.static('assets/css'));

// npm install express-session

const session = require('express-session');
app.use(session({
    secret: 'terrace cat', // any random string used for configuring the session
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))

//npm install express-handlebars
const exphbs = require('express-handlebars');
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

//npm install mongoose 
const mongoose = require('mongoose');
const fs = require('fs');
const { log } = require('console');


const CONNECTION_STRING = 'mongodb+srv://renhotsai:ptZ7PwgMoOehtsqD@cluster0.hwyn9dw.mongodb.net/MyDb?retryWrites=true&w=majority';
mongoose.connect(CONNECTION_STRING)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'Error connecting to database: '));
db.once('open', () => {
    console.log('Mongo DB connected successfully.');
});
const Schema = mongoose.Schema;


// model

//Product Model
const Product = new Schema({
    product: String,
    price: Number,
    description: String,
});
const product = mongoose.model('product', Product);

// OrderDetail Model

const OrderDetail = new Schema({
    orderId: String,
    productId: String,
    items: Number,
});
const orderDetail = mongoose.model('orderDetail', OrderDetail);

// Order Model
const Order = new Schema({
    status: Number,
    driverId: String,
    orderDate: Date,
    pickUpDate: Date,
    deliveryDate: Date,
    canceledDate: Date,
});

const order = mongoose.model('order', Order);

// Driver
const Driver = new Schema({
    name: String,
    userId: String,
    password: String,
});

const driver = mongoose.model('driver', Driver);


//method


//ensureLogin
const ensureLogin = (req, res, next) => {
    if (req.session.isLoggedIn !== undefined &&
        req.session.isLoggedIn === true &&
        req.session.user !== undefined) {
        // if user has logged in allow them to go to desired endpoint
        next();
    } else {
        return res.render("login", {
            errorMsg: "You must login first to access dashboard",
            layout: false,
        })
    }
}


//createOrderList
const createOrderList = async (orderId) => {
    let amount = 0;
    try {
        const orderFromDb = await order.findOne({ _id: orderId }).lean().exec();
        const orderDetails = await orderDetail.find({ orderId: orderId }).lean().exec();
        const orderInfos = [];
        for (const orderDetail of orderDetails) {
            const productFromDb = await product.findOne({ _id: orderDetail.productId }).lean().exec();
            const orderInfo = {
                productName: productFromDb.product,
                productPrice: productFromDb.price,
                orderItems: orderDetail.items,
                orderDetailId: orderDetail._id,
            }
            orderInfos.push(orderInfo)
            amount += productFromDb.price
        }

        const tax = parseFloat((amount * 0.13).toFixed(2));
        const totalAmount = (amount + tax).toFixed(2);
        const orderList = {
            order: orderFromDb,
            orderInfos: orderInfos,
            amount: amount,
            tax: tax,
            totalAmount: totalAmount,
        }
        if (orderFromDb.status === 3 || orderFromDb.status === 4) {
            const driverFromDb = await driver.findOne({ _id: orderFromDb.driverId });
            if (driverFromDb === null) {
                console.log(`Can't Find driver. _id:${orderFromDb.driverId}`);
                return redirect("/");
            }
            orderList.driverName = driverFromDb.name;
        }

        switch (orderFromDb.status) {
            case -1:
                orderList.isCanceled = true;
                break
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
        return res.redirect("/")
    }
}



app.get('/', (req, res) => {
    console.log(req.session);
    return res.render("index", {
        layout: "layout",
        isLoggedIn: req.session.isLoggedIn,
    });
});


//menu
app.get('/Menu', async (req, res) => {
    try {
        const menuList = await product.find().lean().exec();
        const orderFromDb = await order.findOne({ status: 0 }).lean().exec();
        if (orderFromDb !== null) {
            const pendingOrder = await createOrderList(orderFromDb._id);
            return res.render("menu", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                menuList: menuList,
                orderList: pendingOrder,
            })
        }
        return res.render("menu", {
            layout: "layout",
            isLoggedIn: req.session.isLoggedIn,
            menuList: menuList,
        })
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});


app.get('/AddOrder/:id', async (req, res) => {
    try {

        //find Order
        let orderFromDb = await order.findOne({ status: 0 }).lean().exec();
        if (orderFromDb === null) {
            const newOrder = new order(
                {
                    status: 0,
                }
            )
            orderFromDb = await newOrder.save();
        }
        //find product to add
        const item = await product.findOne({ _id: req.params.id }).lean().exec();
        // find OrderDetail check has same item.
        const orderDetailFromDb = await orderDetail.findOne({ productId: req.params.id, orderId: orderFromDb._id });
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
        return res.redirect("/")
    }
});


app.get('/DelItem/:id', async (req, res) => {
    try {
        //find orderDetail
        const orderDetailFromDb = await orderDetail.findOne({ _id: req.params.id })
        const orderId = orderDetailFromDb.orderId;
        await orderDetailFromDb.deleteOne()

        //if orderDetail is empty remove the order
        const orderDetails = await orderDetail.find({ orderId: orderId }).lean().exec()
        if (orderDetails.length === 0) {
            const orderFromDb = await order.findOne({ _id: orderId });
            orderFromDb.deleteOne();
        }
        return res.redirect("/Menu");
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});


app.get('/SubmitOrder/:id', async (req, res) => {
    try {
        const orderFromDb = await order.findOne({ _id: req.params.id });
        if (orderFromDb === null) {
            console.log(`Order Id ${req.params.id} not found`);
        }
        const updatedValues = {
            status: 1,
            orderDate: new Date(),
        }
        const result = await orderFromDb.updateOne(updatedValues)
        console.log(result);
        return res.redirect("/Order");
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});


//order
app.get('/Order', async (req, res) => {
    try {
        const orderFromDb = await order.find().sort({ orderDate: -1 }).lean().exec();
        if (orderFromDb.length !== 0) {
            const orderList = [];
            for (const order of orderFromDb) {
                if (order.status !== 0) {
                    orderList.push(await createOrderList(order._id))
                }
            }
            console.log(orderList);
            return res.render("order", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                orderList: orderList,
            });
        } else {
            return res.render("order", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                ErrorMsg: "No Order History"
            });
        }
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});





app.get('/CancelOrder/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderFromDb = await order.findOne({ _id: orderId });
        if (orderFromDb !== null) {
            const updatedValues = {
                status: -1,
                canceledDate: new Date(),
            }
            await orderFromDb.updateOne(updatedValues);
            return redirect("/Order");
        }
    } catch (error) {

    }
});


//driver
app.get('/Driver', ensureLogin, async (req, res) => {
    try {
        const statusesToFind = [2, 3];
        const orderFromDb = await order.find({ status: { $in: statusesToFind } }).lean().exec();
        console.log(orderFromDb);
        if (orderFromDb.length !== 0) {
            const orderList = [];
            for (const order of orderFromDb) {
                if (order.status === 2 || (order.status === 3 && order.driverId === req.session.user._id)) {
                    orderList.push(await createOrderList(order._id))
                }
            }
            console.log(orderList);
            return res.render("driver", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                orderList: orderList,
            });
        } else {
            return res.render("driver", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                ErrorMsg: "No Order"
            });
        }
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});


app.get('/PickOrder/:id', ensureLogin, async (req, res) => {
    try {
        const orderFromDb = await order.findOne({ _id: req.params.id });
        const updatedValues = {
            status: 3,
            driverId: req.session.user._id,
            pickUpDate: new Date(),
        }
        await orderFromDb.updateOne(updatedValues);
        return res.redirect("/Driver");
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});


app.get('/Delivered/:id', ensureLogin, async (req, res) => {
    try {
        const orderFromDb = await order.findOne({ _id: req.params.id });
        const updatedValues = {
            status: 4,
            deliveryDate: new Date(),
        }
        await orderFromDb.updateOne(updatedValues);
        return res.redirect("/Driver");
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});

//Login /SignUp

app.get('/Login', (req, res) => {
    return res.render("login", {
        layout: "layout",
        isLoggedIn: req.session.isLoggedIn,
    })
});


app.post('/Login', async (req, res) => {
    try {
        console.log(req.session);
        if (!req.session.isLoggedIn) {
            const userId = req.body.userId;
            const password = req.body.password;
            if (userId === "" || userId === undefined || password === "" || password === undefined) {
                return res.render("login", {
                    layout: "layout",
                    isLoggedIn: req.session.isLoggedIn,
                    ErrorMsg: "User Id / Password is empty"
                })
            }
            const user = await driver.findOne({ userId: userId }).lean().exec();
            if (user === null) {
                return res.render("login", {
                    layout: "layout",
                    isLoggedIn: req.session.isLoggedIn,
                    ErrorMsg: "User Id / Password is Error"
                })
            }

            if (password !== user.password) {

                return res.render("login", {
                    layout: "layout",
                    isLoggedIn: req.session.isLoggedIn,
                    ErrorMsg: "User Id / Password is Error"
                })
            }

            req.session.user = user;
            req.session.isLoggedIn = true;
            console.log(req.session);
            return res.redirect("/Driver");
        }
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});

app.get('/SignUp', (req, res) => {
    return res.render("signUp", {
        layout: "layout",
        isLoggedIn: req.session.isLoggedIn,
    })
});

app.post('/SignUp', async (req, res) => {
    try {
        const userId = req.body.userId;
        const password = req.body.password;
        const name = req.body.name;
        if (userId === "" || userId === undefined || password === "" || password === undefined || name === "" || name === undefined) {
            return res.render("signUp", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                ErrorMsg: "User Id / Password is empty"
            })
        }
        const user = await driver.find({ userId: userId }).lean().exec();
        if (user.length !== 0) {
            return res.render("signUp", {
                layout: "layout",
                isLoggedIn: req.session.isLoggedIn,
                ErrorMsg: "UserId has been used."
            })
        }
        const newDriver = new driver({
            userId: userId,
            password: password,
            name: name,
        });
        await newDriver.save();

        req.session.user = newDriver
        req.session.isLoggedIn = true;

        return res.redirect("/Driver");
    } catch (error) {
        console.log(error);
        return res.redirect("/")
    }
});

app.get('/Logout', ensureLogin, (req, res) => {
    console.log(req.session);
    req.session.destroy()
    return res.redirect("/")
});


const onHTTPStart = () => {
    console.log(`Server has started. Visit http://localhost:${HTTP_PORT}`);
    console.log(`User Ctrl+C to stop the server`);
};
app.listen(HTTP_PORT, onHTTPStart);