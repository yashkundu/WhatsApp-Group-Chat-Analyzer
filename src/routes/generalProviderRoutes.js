const express = require('express');
const mongoose = require('mongoose');

const Chat = mongoose.model('Chat');

const router = express.Router();

router.get('/overview',async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send("You are not authorized to access the group information");
    }
    const id = authorization.replace('id ','');
    let messagesSent=0, mediaPosted=0, participantsCount=0;
    try{
        messagesSent =await Chat.countDocuments({userId: mongoose.Types.ObjectId(id), type: {$ne : "general"}}).exec();

        mediaPosted = await Chat.countDocuments({userId: mongoose.Types.ObjectId(id), type: "media"}).exec();

        participantsCount = await Chat.distinct('sender').exec();
        participantsCount = participantsCount.length;
    }
    catch(err){
        res.status(401).send("Error in getting the overview");
    }
    res.send({messagesSent,mediaPosted,participantsCount}); 
});

router.get('/leaderboard',async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status.send("You are not authorized to access the group information.")
    }
    const id = authorization.replace('id ','');

    try{
    let participants = await Chat.distinct('sender',{userId: mongoose.Types.ObjectId(id)}).exec();
    let leaderboard = participants.map(async (participant)=>{       
        let messages = await Chat.countDocuments({
            userId: mongoose.Types.ObjectId(id),
            sender: participant,
            type: {$nin : ['general', 'deleted']}
        }).exec();
        return {
            participant,
            messages
        };   
    });   

    Promise.all(leaderboard).then((result)=>{
        res.send(result.sort(function(a,b){
            return b.messages-a.messages;
        }).slice(0,10));
    }); 
    
    }
    catch(err){
        res.status(401).send("Error in finding leaderboard.")
    }

});

router.get('/influencers', async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send("You are not authorized to access the group information");
    }
    const id = authorization.replace('id ','');

    try{
    let participants = await Chat.distinct('sender',{userId: mongoose.Types.ObjectId(id)}).exec();
    let leaderboard = participants.map(async (participant)=>{
        let messages = await Chat.countDocuments({
            userId: mongoose.Types.ObjectId(id),
            sender: participant,
            type: {$nin: ['general', 'deleted']}
        }).exec();

        return {
            participant,
            messages
        };
    });

    leaderboard = await Promise.all(leaderboard);
    let or = leaderboard.reduce(function(a,b){
        if(a.messages>b.messages){
            return a;
        } 
        return b;          
    });
    let orator = {name: or.participant, messages: or.messages};
    let recruiter = {};

    let adders = await Chat.distinct('sender',{userId: mongoose.Types.ObjectId(id), type: 'general', text: /^added\s/}).exec();
    
    if(adders){
        let recruiters = adders.map(async (adder)=>{
            let recruited = await Chat.countDocuments({
                userId: mongoose.Types.ObjectId(id),
                type: 'general',
                sender: adder,
                text: /^added\s/
            }).exec();
            return {
                "name": adder,
                "recruited": recruited
            };
        });

        recruiters = await Promise.all(recruiters);

        recruiter = recruiters.reduce(function(a,b){
            if(a.recruited>b.recruited){
                return a;
            }
            return b;
        });       
    }
    
    res.send({orator, recruiter});
    }
    catch(err){
        res.status(401).send("Error in finding influencers.")
    }
    
});





module.exports = router;