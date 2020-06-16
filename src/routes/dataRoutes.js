const express = require('express');
const mongoose = require('mongoose');
const Group = mongoose.model('Group');
const input = require('../analysis/input');

const router = express.Router();

router.post('/saveChat',async (req,res)=>{

    let info = req.body.data;
    info = info.split('<nl>');
    let groupName = '';
    let creator = '';

    if((info[1]).search(/\screated\sgroup\s/)!=-1){        
        let arr = (info[1]).match(/\-\s([\S\s]*)\screated\sgroup\s\'([\S\s]*)\'/);
        creator = arr[1];
        groupName = arr[2];
    }
    try{
        const group = new Group({groupName, creator});
        await group.save();
        console.log('Group inserted into the database.');
        req.id = group._id;
        input(req);
        res.send(req.id);
    }
    catch(err){
        return res.status(422).send(err.message);
    }                  
});

module.exports = router;