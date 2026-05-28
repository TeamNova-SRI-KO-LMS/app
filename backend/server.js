const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Route files
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB database!"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Mount routers
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Express App Running!");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});