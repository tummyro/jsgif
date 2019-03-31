const fs = require('fs'),
    express = require('express'),
    app = express(),
    port = 3000,
    https = require("https"),
    request = require('request'),
    UPLOAD_DIR = './tuw/invitations';
    
    app.get('/', (req, res) => {
        // download = function(uri, filename, callback){
        //     request.head(uri, function(err, res, body){
        //       console.log('content-type:', res.headers['content-type']);
        //       console.log('content-length:', res.headers['content-length']);
          
        //       request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        //     });
        // };
        // download('https://dev.tummy.ro/friendsInvite.gif', `${UPLOAD_DIR}/friends-invite.gif`, function(){
        //     res.send('Sucessfully downloaded');
        // });

        // request('tuw/friends-invite.html', function(err,resp, body) {
        //     console.log(err,resp,body);
        // });
       
    });

    app.get('/invitationTemplate', (req,res) => {

       
        res.sendFile(__dirname+'/friends-invite.html');

    });

app.listen(port, () => console.log(`Listening app on port ${port}!`));


//fs.createReadStream('https://dev.tummy.ro/friendsInvite.gif').pipe(fs.createWriteStream('newLog.gif'));


   // });

