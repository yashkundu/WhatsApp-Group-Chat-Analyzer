# WhatsApp-Group-Chat-Analyzer
REST API that will analyze the WhatsApp groups and chats.

Architecture
The API is created using NodeJS and Express web framework with Mongo DB as database backend.

How to Use:
Send the group chat from export chat file as a POST request and you will then get an authorization token which will be used to authorize
you. Send GET request to the url to get the analyzed data.

Features : 
-It will provide a detailed analysis of a whatsapp group by using its export chat file.
-It will also provide sentimental analysis by using DatumBox API about each group member.
