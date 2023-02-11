const express = require('express')
const {requireSignin} = require('./auth')
const { checkToken } = require('./auth');
const  {Sequelize,DataTypes} = require('sequelize')
const jwt = require("jsonwebtoken");
const mysql = require('mysql2')
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const app = express();
app.use(bodyParser.json());
process.env.JWT_SECRET = "prashant";
const sequelize = new Sequelize('ecommerce','root','Prashant#9650',{
    host:'localhost',
    dialect:'mysql'
}
)
sequelize.authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

//Model- Customer/Users
const User = sequelize.define('customer', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true
     },
    firstname: {
        type: Sequelize.STRING
    },
    lastname: {
        type: Sequelize.STRING
      },
    mobile: {
        type: Sequelize.STRING 
    },
    address:{
      type: DataTypes.TEXT,
      get: function() {
        return JSON.parse(this.getDataValue('address'));    
      },
      set: function(val) {
        this.setDataValue('address', JSON.stringify(val));
      }
    },
    // DefaultAddress:{
    //   type:DataTypes.TEXT,
    //   defaultValue: function(){
    //       return JSON.stringify(this.address[0])
    //   } 
    // },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
  },
   {
    timestamps: false
  });

//Model- Product
const Product = sequelize.define('product', {
  product_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  detail: Sequelize.STRING,
  price: Sequelize.FLOAT,
  availability: Sequelize.BOOLEAN
  },{
  timestamps: false
});

//Model-Order
const Order = sequelize.define('orderdetail', {
     order_id: {
     type: Sequelize.INTEGER,
     primaryKey: true,
     autoIncrement: true,
     },
    cust_id:{
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id"
      }
    },
    product_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: "product_id"
      }
      },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      },
    Delivery_Status:{
        type:Sequelize.STRING,
        defaultValue: 'placed',
      }
  },{
    timestamps: false
  });

User.hasMany(Order, { foreignKey: "cust_id" });
Product.hasMany(Order, { foreignKey: "product_id" });

sequelize.sync()
  .then(() => console.log('Tables created successfully'))
  .catch(err => console.error('Error creating tables: ', err));

//Display All Customers---------------------------------
app.get("/ecommerce/listcustomer", async (req, res) => {
    try {
      const user = await User.findAll();
      res.json(user);
    } catch (error) {
      console.error(error);
      return error;
    }
});

//Signup- Adding one more user--------------------
app.post("/ecommerce/signup", async (req,res) => {
    try {
        const user = await User.create({
        id:req.body.id,
        firstname:req.body.firstname,
        lastname:req.body.lastname,
        mobile:req.body.mobile,
        address:req.body.address,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      });
      res.json({ message: 'User created successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
}); 

//sign in----------------------------------------
app.post("/ecommerce/signin", async (req,res) => {
        try {
        const user = await User.findOne({ where: { email: req.body.email } });
        if (!user) {
          return res.status(400).json({ error: "User not found" });
        }
        const result = await bcrypt.compare(req.body.password, user.password);
        if (!result) {
          return res.status(400).json({ error: 'Incorrect password' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: 86400 // expires in 24 hours
        });                    
        res.json({
          message: 'Sign in successful',
          id: user.id,
          email: user.email,
          token: token
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
        }
});



//Display All Customers---------------------------------
app.get("/ecommerce/listcustomer", async (req, res) => {
  try {
    const user = await User.findAll();
    res.json(user);
  } catch (error) {
    console.error(error);
    return error;
  }
});

//products list for admin (name, detail, price)--------
app.get("/ecommerce/productlist", async (req, res) => {
  try {
    const product = await Product.findAll();
    res.json(product);
  } catch (error) {
    console.error(error);
    return error;
  }
});

//add new product for admin---------------------------
app.post("/ecommerce/addproduct", async (req,res) => {
  try {
      const product = await Product.create({
      product_id:req.body.product_id,
      name:req.body.name,
      detail:req.body.detail,
      price:req.body.price,
      availability:req.body.availability,
    });
    res.json({ message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}); 

//active product list for users
app.get("/ecommerce/activeproducts", async (req, res) => {
  try {
    const product = await Product.findAll({
      where: {
        availability: true,
      },
    });
    res.json(product);
  }catch (error) {
    console.error(error);
    return error;
  }
});

//User Placing a order- Orderdetails
app.post("/ecommerce/placeorder", requireSignin ,  checkToken , async (req,res) => {

  try {
      //  const decoded=  jwt.verify(req.token, process.env.JWT_SECRET)
      //  if(!decoded){
      //   res.status(401).json({ error: "Failed to authenticate token" });
      //  }
  //      const userId = decoded.id;  
  //      let order_id=req.body.order_id
  //      let product_id=req.body.product_id
  //      let quantity=req.body.quantity
  //      const product = await Product.findOne({
  //    where: {
  //     product_id: product_id
  //    }})
  //    if (!product) {
  //      return res.status(404).send({
  //        error: 'Product not found'
  //      });
  //    }
  //    if (!product.availability) {
  //      return res.status(400).send({
  //        error: 'Product not available'
  //      });
  //    }
  //    const order = await Order.create({
  //    order_id:order_id,
  //    cust_id:userId,
  //    product_id:product_id,
  //    quantity:quantity,
  //  });
res.json({ message: 'Order placed successfully' });

} 
catch (err) {
   console.log(err)
res.status(500).json({ message: 'Error placing order' });
}
});  
// jwt.verify(req.token, process.env.JWT_SECRET, (err, decoded) => {
//   if (err) {
//     return res.status(401).json({ message: 'Invalid token' });
//   }

//   const cust_id = decoded.id;
//   // Place order using userId
//   const { product_id, quantity } = req.body;
//   const order = { cust_id,product_id, quantity };
    
//   // Insert order into database
//   Order.create(order)
//     .then(() => {
//       res.json({ message: 'Order placed successfully'});
//     })
//     .catch(error => {
//       res.status(500).json({ message: 'Error placing order' });
//     });
// });
// });        


//orders list (which user ordered which product) for admin
app.get("/ecommerce/orderlist", async (req, res) => {
  try {
    const order = await Order.findAll();
    res.json(order);
  }catch (error) {
    console.error(error);
    return error;
  }
});


//orders list for user (last orders of users)
app.get("/ecommerce/orderlist/:id", async (req, res) => {
  try {
    const order = await Order.findAll({
      where:{
        cust_id:req.params.id
      }
    });
    res.json(order);
  }catch (error) {
    console.error(error);
    return error;
  }
});

//update delivery_status in Order table by Admin----

app.post("/ecommerce/updateDeliveryStatus/:id", async (req,res)=>{
 try{
  Order.update({ Delivery_Status: req.body.Delivery_Status}, {
    where: {
      order_id: req.params.id
    }})
    res.json({ message: 'Delivery status changed successfully' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update Product_status in Product table by Admin----

app.post("/ecommerce/updateProductStatus/:id", async (req,res)=>{
  try{
   Product.update({ availability: req.body.availability}, {
     where: {
      product_id: req.params.id
     }})
     res.json({ message: 'Product status changed successfully' });
   }
   catch (err) {
     res.status(500).json({ error: err.message });
   }
 });

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
  