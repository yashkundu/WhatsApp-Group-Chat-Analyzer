const express = require('express');
const mongoose = require('mongoose');

const Chat = mongoose.model('Chat');

const router = express.Router();

router.get('/participants',async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.');
    }
    const id = authorization.replace('id ','');
    try{
        const participants = await Chat.distinct('sender',{userId: mongoose.Types.ObjectId(id)}).exec(); 
        res.send(participants);
    }
    catch(err){
        res.status(401).send('Error in finding participants.')
    }
});

router.get('/participantInfo',async (req,res)=>{

    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.')
    }
    const id = authorization.replace('id ','');

    const participant = req.query.participant;
    if(!participant){
        res.status(401).send('No participant selected.');
    }

    const messagesCount = await Chat.countDocuments({
        userId: mongoose.Types.ObjectId(id),
        type: 'message',
        sender: participant      
    }).exec();

    const positiveMessagesCount = await Chat.countDocuments({
        userId: mongoose.Types.ObjectId(id),
        type: 'message',
        sender: participant,
        sentiment: 'positive'
    }).exec();

    const negativeMessagesCount = await Chat.countDocuments({
        userId: mongoose.Types.ObjectId(id),
        type: 'message',
        sender: participant,
        sentiment: 'negative'
    }).exec();

    const sentimentAnalysis = {
        positiveMessages: (positiveMessagesCount/messagesCount)*100 + '%',
        negativeMessages: (negativeMessagesCount/messagesCount)*100 + '%',
        neutralMessages: ((messagesCount-positiveMessagesCount-negativeMessagesCount)/messagesCount)*100 + '%'
    };

    const mediaPosted = await Chat.countDocuments({
        userId: mongoose.Types.ObjectId(id),
        type: 'media',
        sender: participant
    }).exec();

    const membersAdded = await Chat.countDocuments({
        userId: mongoose.Types.ObjectId(id),
        type: 'general',
        sender: participant,
        text: /^added\s/
    }).exec();

    const messages = await Chat.find({
        userId: mongoose.Types.ObjectId(id),
        type: 'message',
        sender: participant
    },"date time text sentiment -_id").exec();

    res.send({messagesCount, mediaPosted,membersAdded,sentimentAnalysis, messages});

});

router.get('/left', async (req,res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.');
    }
    const id = authorization.replace('id ','');

    const leftUsers = await Chat.find({
        userId: mongoose.Types.ObjectId(id),
        type: 'general',
        text: 'left'},
    'date time sender -_id').exec();

    res.send(leftUsers);
});

router.get('/contacts', async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.');
    }
    const id = authorization.replace('id ','');

    let contacts = await Chat.find({
        userId: mongoose.Types.ObjectId(id),
        type: 'contact'},
        'date time sender text -_id'
    ).exec();

    contacts = contacts.map(function(contact){
        return {
            date: contact.date,
            time: contact.time,
            sender: contact.sender,
            contact: contact.text.replace(' (file attached)','')
        };
    });

    res.send(contacts);

});

router.get('/deleters',async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.');
    }
    const id = authorization.replace('id ','');

    const deleters = await Chat.distinct('sender',{
        userId: mongoose.Types.ObjectId(id),
        type: 'deleted'
    }).exec();

    const ranking = deleters.map(async (deleter)=>{
        const messages = await Chat.countDocuments({
            userId: mongoose.Types.ObjectId(id),
            type: 'deleted',
            sender: deleter
        }).exec();

        return {   
            participant: deleter,
            messagesDeleted: messages
        };
    });

    Promise.all(ranking).then((result)=>{
        res.send(result.sort(function(a,b){
            return b.messages-a.messages;
        }));
    });


});

module.exports = router;