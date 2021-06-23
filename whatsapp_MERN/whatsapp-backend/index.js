
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Cors from 'cors';
import Pusher from 'pusher';

//app config
const app = express();
const port = process.env.PORT || 9000;
const connection_url = 'mongodb+srv://joe_mongo:jy0thsna@cluster0.uljvl.mongodb.net/whatsappMERN?retryWrites=true&w=majority';

const pusher = new Pusher({
    appId: "1221521",
    key: "9da20ad84b4045379ede",
    secret: "8d339c1edaa4b6fcbe6a",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json());
app.use(Cors());

//DB config
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

//api routes
const db = mongoose.connection
db.once("open",() => {
    console.log("DB Connected");
    const msgCollection = db.collection("whatsappmessages");
    const changeStream = msgCollection.watch();

    changeStream.on('change',change => {
        console.log(change);
        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument
            pusher.trigger("messages","inserted",{
                message: messageDetails.message,
                name: messageDetails.name,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else{
            console.log('Error triggering on Pusher');
        }
        
    });
});

app.get("/",(req,res) => res.status(200).send("whatsapp MERN - Thewebdev"));

app.get('/messages/sync', (req,res) =>{
    
    Messages.find((err,data) => {
        if(err)
            res.status(500).send(err);
        else
            res.status(201).send(data);
    });
});
app.post('/messages/new', (req,res) =>{
    const dbMessage = req.body;
    Messages.create(dbMessage,(err,data) => {
        if(err)
            res.status(500).send(err);
        else
            res.status(201).send(data);
    });
});
//listen
app.listen(port,() => console.log(`listening on localhost: ${port}`));