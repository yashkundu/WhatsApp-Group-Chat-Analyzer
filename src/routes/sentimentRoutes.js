const express = require('express');
const mongoose = require('mongoose');

const Chat = mongoose.model('Chat');

const router = express.Router();

router.get('/sentimentRanking', async (req, res)=>{
    const {authorization} = req.headers;
    if(!authorization){
        res.status(401).send('You are not authorized to access the group information.');
    }
    const id = authorization.replace('id ','');

    try{
        let participants = await Chat.distinct('sender',{userId: mongoose.Types.ObjectId(id)}).exec();
        let leaderboard = participants.map(async (participant)=>{
            const messagesCount = await Chat.countDocuments({
                userId:  mongoose.Types.ObjectId(id),
                type: 'message',
                sender: participant
            }).exec();

            const positiveMessagesCount = await Chat.countDocuments({
                userId: mongoose.Types.ObjectId(id),
                type: 'message',
                sender: participant,
                sentiment: 'positive'
            }).exec();

            return {
                participant,
                positiveMessages: (positiveMessagesCount/messagesCount)*100
            };
        });

        Promise.all(leaderboard).then((result)=>{
            res.send(result.sort(function(a,b){
                return b.positiveMessages-a.positiveMessages;
            })).slice(0,10);
        });
    }

    catch(err){
          res.status(401).send('Error in calculating sentimental Ranking.');  
    }
    
});

module.exports = router;