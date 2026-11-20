require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const health = require('./routes/health')
const analysis = require("./routes/analysis.routes")
const { protect } = require('./middleware/auth');

const app = express();

connectDB();


app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get('/api/session',protect,(req,res)=>{
  if(!req.user){
    return res.status(401).json({
      success:false,
      message:"Please Login First"
    })
  }
  res.status(200).json({
    success:true,
    message:"Welcome",
    user: req.user,
  })

})

// Routes 
app.use('/api/health', health);
app.use('/api/auth', authRoutes);
app.use('/api/resume',analysis);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
});