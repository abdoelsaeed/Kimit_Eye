const mongoose = require('mongoose');
const db =
  process.env.DB ||
  "mongodb+srv://abdoelsaeed2:12345@cluster000.h7jdjme.mongodb.net/Kimit?retryWrites=true&w=majority&appName=Cluster000";
;
mongoose.
connect(db)
.then(()=>{ console.log('DB Connection Successfully')})
.catch((err)=>{ console.error("DB connection error: ", err); })
module.exports = db;