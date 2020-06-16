const mongoose = require('mongoose');
const Chat = mongoose.model('Chat');
const axios = require('axios');



const input =function(req){
    
    let info = req.body.data;

    info = info.split('<nl>');

    let genInfo = [];
    let media = [];
    let contacts = [];
    let links = [];
    let deleted = [];

    function concat(item, index){   
        while(index<info.length-1 && ((info[index+1]).search(/\d{2}\/\d{2}\/\d{4}/)===-1)){
            info[index] += info[index+1];
            info.splice(index+1,1);
        }
    }

    function separateGeneral(item, index){
        while(index<info.length && ((info[index]).search(/\-\s[\w\s]*\:|\-\s\+[\d\s]*\:/)===-1)){
            genInfo.push(info[index]);
            info.splice(index,1);
        }
    }
    function separateMedia(item, index){
        while(index<info.length && ((info[index]).search(/\:\s<Media omitted>/)!=-1)){
            media.push(info[index]);
            info.splice(index,1);
        }
    }
    function separateContact(item, index){
        while(index<info.length && ((info[index]).search(/\w\.vcf\s\(file attached\)$/)!=-1)){
            contacts.push(info[index]);
            info.splice(index,1);
        }
    }
    function separateLink(item, index){
        while(index<info.length &&((info[index]).search(/http(s)?:\/\/[\w.]+(\/\S*)?/)!=-1)){
            links.push(info[index]);
            info.splice(index,1);
        }
    }
    function separateDeleted(item, index){
        while(index<info.length && ((info[index]).search(/:\sThis\smessage\swas\sdeleted$/)!=-1)){
            deleted.push(info[index]);
            info.splice(index,1);
        }
    }

    info.forEach(concat);
    info.forEach(separateGeneral);
    info.forEach(separateMedia);
    info.forEach(separateContact);
    info.forEach(separateLink);
    info.forEach(separateDeleted);

    var messageArray = info.map(async (str)=>{
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*?)\:\s([\S\s]*)$/);
        
        let sentiment = null;
        try{
        sentiment = await axios.get('http://api.datumbox.com:80/1.0/SentimentAnalysis.json',{
            params: {
                api_key: '62a5836fa955f0f882fc36f6b027c418',
                text: arr[5]
            }
        });
        console.log('Datumbox request succesfully made.');
        }
        catch(err){
            console.log('Error in making Datumbox request');
        }

        result = sentiment?sentiment.data.output.result:'positive';
        return {
            userId: req.id,
            type: "message",
            date: arr[1],
            time: arr[2],
            sender: arr[4],
            text: arr[5],
            sentiment: result
        };
    });

    Promise.all(messageArray).then((result)=>{
        console.log('All Datumbox requests made')
        Chat.collection.insert(result, function(err, docs){
            if(err){
                console.error(err);
            }
            else{
                console.log("Messages inserted into the database.");
            }
        });
    });

    if((genInfo[0]).search(/Messages to this group are now secured/)){
        genInfo.splice(0,1);
    }


    var genInfoArray = genInfo.map(function(str){
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*)\s(added|created|changed|deleted|left|joined)([\S\s]*)$/);
        return {
            userId: req.id,
            type: 'general',
            date: arr[1],
            time: arr[2],
            sender: arr[4],
            text: arr[5]+arr[6]
        };
    });

    Chat.collection.insert(genInfoArray, function(err, docs){
        if(err){
            console.error(err);
        }
        else{
            console.log("General inserted into the database");
        }
    });

    var mediaArray = media.map(function(str){
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*?)\:\s([\S\s]*)$/);
        return {
            userId: req.id,
            type: 'media',
            date: arr[1],
            time: arr[2],
            sender: arr[4],
            text: arr[5]
        };
    });

    Chat.collection.insert(mediaArray, function(err, docs){
        if(err){
            console.error(err);
        }
        else{
            console.log('Media inserted into the database');
        }
    });

    var contactsArray = contacts.map(function(str){
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*?)\:\s([\S\s]*)$/);
        return {
            userId: req.id,
            type: 'contact',
            date: arr[1],
            time: arr[2],
            sender: arr[4],
            text: arr[5]
        };
    });

   Chat.collection.insert(contactsArray, function(err, docs){
       if(err){
           console.error(err);
       }
       else{
           console.log('Contacts are inserted into the database');
       }
   });

    var linksArray = links.map(function(str){
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*?)\:\s([\S\s]*)$/);
        return {
        userId: req.id,
        type: 'link',
        date: arr[1],
        time: arr[2],
        sender: arr[4],
        text: arr[5]
        };
   });

    Chat.collection.insert(linksArray, function(err, docs){
        if(err){
            console.error(err);
        }
        else{
            console.log('Links are inserted into the database');
        }
    });

    var deletedArray = deleted.map(function(str){
        const arr = str.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\,\s(\S*\s(AM|am|PM|pm)?)\s?\-\s([\S\s]*?)\:\s([\S\s]*)$/);
        return {
        userId: req.id,
        type: 'deleted',
        date: arr[1],
        time: arr[2],
        sender: arr[4],
        text: arr[5]
        };
    });

    Chat.collection.insert(deletedArray, function(err, docs){
        if(err){
            console.error(err);
        }
        else{
            console.log('Deleted messages are inserted into the database');
        }
    });

    
}

module.exports = input;

