//const express = require("express");
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import cors from "cors";
import Razorpay from "razorpay";
//const Razorpay = require("razorpay");



dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Failed:", err));
//user otp schema
  const otpSchema = new mongoose.Schema({
  phoneNo: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Otp = mongoose.model("Otp", otpSchema);

// helper  funnction
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// generate otp  root
app.post("/generate-otp", async (req, res) => {
  try {
    const { phoneNo } = req.body;
    if (!phoneNo) return res.status(400).json({ success: false, message: "Phone required" });

    const otpValue = genOtp();
    const ttlMinutes = 5;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
      { phoneNo },
      { otp: otpValue, createdAt: new Date(), expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Testing only: return OTP in response
    return res.json({ success: true, message: "OTP generated", otp: otpValue, expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});
// verify otp 
app.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNo, otp } = req.body;

    // 1️⃣ Check if phone and otp provided
    if (!phoneNo || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // 2️⃣ Find OTP record for given phone
    const record = await Otp.findOne({ phoneNo });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this phone or it may have expired",
      });
    }

    // 3️⃣ Check expiry
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ phoneNo }); // delete expired OTP
      return res.status(400).json({
        success: false,
        message: "OTP has expired, please request a new one",
      });
    }

    // 4️⃣ Check if OTP matches
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP, please try again",
      });
    }

    // 5️⃣ OTP verified successfully
    await Otp.deleteOne({ phoneNo }); // remove OTP after verification

    return res.status(200).json({
      success: true,
      message: "✅ OTP verified successfully!",
    });

  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying OTP",
    });
  }
});
// userid and password creation
const userSchema = new mongoose.Schema({
  name: String,
  phoneNo: String,
  userId: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

//userdata schema 
const userData = new mongoose.Schema({
  userName: {
    type: String,
    require:true,
    maxlength: 80 
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10, // 10 characters
  },
  coin: {
   type: Number,
   default: 0,
  },
  phoneNo: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // exactly 10 digits
  },
  additionalPhoneNo: {
    type: String,
    match: /^[0-9]{10}$/, // optional 10 digits
  },
  userAddress: [
    {
      pincode: {
        type: String,
        maxlength: 6,
      },
      landmark: {
        type: String,
      },
      buildingName: {
        type: String,
      },
      colonyName: {
        type: String,
      },
      addressText: {
        type: String,
      },
    },
  ],
  orders: [
    {
      orderId: {
        type: String,
        maxlength: 10,
      },
      orderValue: {
        type: Number,
        
      },
      tag: {
        type: [String], // JSON object
        default: [],
      },
      paymentStatus: {
        type: Number, // 0 = pending, 1 = completed
        enum: [0, 1],
        default: 0,
      },
      deliveryAddress: {
        type: String,
  
      },
      orderStatus: {
       type: String,
       enum: ["Received", "Under Process", "Dispatch", "Delivered"],
       default: "Received"
      },

      
    },
  ],
  paymentHistory: [
    {
     orderId: {
      type: String
       },
     orderValue: {
      type: Number
       },
    },
  ]
});

const UserData = mongoose.model("UserData", userData);

// --- Route: Register New User ---
app.post("/register", async (req, res) => {
  try {
    const { userName, phoneNo, password, verifypassword} = req.body;

    // Validate inputs
    if (!userName || !phoneNo || !password || !verifypassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Generate userId
    const firstThree = userName.substring(0, 3).toUpperCase(); // First 3 letters of name in CAPS
    const lastSeven = phoneNo.slice(-7); // Last 7 digits of contact number
    const userId = firstThree + lastSeven;

    // Create and save user
     // password encrypt karte hain (secure rakhne ke liye)
     const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ userName, phoneNo, userId, password:hashedPassword});
    await newUser.save();
    const newUserData= new UserData({ userName,userId, phoneNo});
    await newUserData.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: userId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// --- Login Route (Token generation yahan hota hai) ---
app.post("/login", async (req, res) => {
  const { userid, password } = req.body;

  const user = await User.findOne({ userid });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  // ✅ Token Generate karo
  const token = jwt.sign(
    { userId: user.userId },
    process.env.JWT_SECRET,   // secret key (sirf server ke paas hoti hai)
    { expiresIn: "1h" } // token 1 ghante me expire ho jayega
  );

  res.json({
    message: "Login successful",
    token: token
  });
}); 
// blow the section the program is  responsibel  for orderid generation 
// Define Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
});

// Create Model
const Order = mongoose.model("Order", orderSchema);

// Function to generate unique 12-digit order ID
function generateOrderId() {
  const timestamp = Date.now().toString().slice(-8); // last 8 digits of timestamp
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return timestamp + randomPart; // total = 12 digits
}

// POST route to generate new order ID
app.post("/generate-order", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let orderId;
    let existingOrder;

    // Ensure orderId uniqueness
    do {
      orderId = generateOrderId();
      existingOrder = await Order.findOne({ orderId });
    } while (existingOrder);

    const date = new Date();

    // Save to MongoDB
    const newOrder = new Order({ orderId, date });
    await newOrder.save();

    // Send response
    res.status(201).json({
      message: "Order ID generated successfully",
      userId,
      orderId,
      date,
    });
  } catch (error) {
    console.error("Error generating order ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
 // 🔒 Middleware to verify token
function verifyToken(req, res, next) {
  // Token header se lo
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // 'Bearer <token>'

  // Agar token nahi mila
  if (!token) {
    return res.status(401).json({ message: "Access Denied. No Token Provided." });
  }

  try {
    // Token verify karo
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // verified user ko req me store karo
    next(); // ✅ Next middleware or route handler pe jao
  } catch (err) {
    res.status(403).json({ message: "Invalid or Expired Token" });
  }
}

//this root for retraving data from mongodb database to show order on the screen
app.get("/userdata", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // userId from token

    const user = await UserData.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({
      orders: user.orders, // ✅ send only that user’s orders
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// this root for soring address form data in to the mongodb database

app.post("/addaddress", verifyToken, async (req, res) => {
  try {
    const { pincode, landmark, buildingName, colonyName, addressText } = req.body;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required!" });
    }
    const userId = req.user.userId; // extracted from token

    const user = await UserData.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // create address object
    const addressObj = { pincode, landmark, buildingName, colonyName, addressText };

    // ✅ Option 1: Create new user with address
    user.userAddress.push(addressObj);
    await user.save();

    res.status(200).json({
      message: "✅ Address added successfully!",
      data: user.userAddress,
    });

  } catch (error) {
    console.error("❌ Error saving address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
 // this script to set deliveryAddress

 app.post("/setaddress", verifyToken, async (req, res) => {
  try {
    const { selectedOption } = req.body;
    const userId = req.user.userId; // extracted from token

    const user = await UserData.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // create address object
    const selectedaddress = { selectedOption };

    // ✅ Option 1: Create new user with address
    user.deliveryAddress.push(selectedaddress);
    await user.save();

    res.status(200).json({
      message: "✅ Address added successfully!",
      data: user.deliveryAddress,
    });

  } catch (error) {
    console.error("❌ Error saving address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order route
app.post("/create-order", verifyToken, async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// Verify payment and update wallet
app.post("/verify", verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Update user wallet
    const user = await UserData.findById(req.user.id);
    user.coin += parseInt(req.body.amount / 100); // add amount in rupees
    await user.save();

    return res.json({ success: true, newBalance: user.wallet });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
});
