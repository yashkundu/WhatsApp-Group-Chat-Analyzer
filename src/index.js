require('./models/Group');
require('./models/Chat');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes/dataRoutes');
const generalProviderRoutes = require('./routes/generalProviderRoutes');
const specificProviderRoutes = require('./routes/specificProviderRoutes');
const sentimentRoutes = require('./routes/sentimentRoutes');

const app = express();
app.use(bodyParser.json());
app.use(dataRoutes);
app.use(generalProviderRoutes);
app.use(specificProviderRoutes);
app.use(sentimentRoutes);

const mongoUri = 'mongodb+srv://kunduyash:299792458@cluster0-8tyb7.mongodb.net/test?retryWrites=true&w=majority'
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected',()=>{
    console.log('Connected to mongo instance');
});

mongoose.connection.on('error', (err)=>{
    console.error('Error connecting to mongo', err);
});

app.get('/',(req,res)=>{
    res.send('Hi there!');
});

app.listen(3000,()=>{
    console.log('Listening on port 3000');
});