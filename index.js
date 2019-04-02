const fs = require('fs'),
    express = require('express'),
    app = express(),
    port = 3000,
    UPLOAD_DIR = './tuw/invitations',
    jsdom = require("jsdom"),
    { createCanvas, loadImage } = require('canvas'),
    { JSDOM } = jsdom,
    { document } = (new JSDOM(`<!DOCTYPE html>`)).window,
    SpeechBubble = require('./tuw/js/speechBubble');

global.atob = require("atob");

eval(fs.readFileSync('./GIFEncoder.js') + '');
eval(fs.readFileSync('./NeuQuant.js') + '');
eval(fs.readFileSync('./LZWEncoder.js') + '');
eval(fs.readFileSync('./Demos/b64.js') + '');
eval(fs.readFileSync('./tuw/js/canvasHelper.js') + '');

const lineheight = 30,
    limitCharacters = 35;


app.get('/invitationTemplate', (req, res) => {
    const canvas = createCanvas(600, 820)
    const ctx = canvas.getContext('2d')
    var optionsEncoded = 'QnVuJUM0JTgzJTIwc2Rhc2QlMjMlMkNBbCUyMHQlQzQlODN1JTIwY29sZWclMjMlMjBlbGlhcyUyMGRlYnMlMjMlMjB2cmVhJTIwcyVDNCU4MyUyMCVDOCU5OXRpaSUyMGMlQzQlODMlMjAuLi4lMkMuLi5kaW4lMjBtb21lbnQlMjBjZSUyMHRlJTIwY29uc2lkZXIlQzQlODMlMjBuZXN0JUM0JTgzcGFuaXQlMjBpbiUyMGZhJUM4JTlCYSUyMHByJUM0JTgzaml0dXJpbG9yJTIzJTJDdnJlYSUyMHNhJTIwaSUyMHRlJTIwYWwlQzQlODN0dXJpJTIwcyVDNCU4MyUyMHNhdnVyYSVDOCU5QmklMjBvZmVydGUlMjBsYSUyMGp1bWF0YXRlJTIwZGUlMjBwcmUlQzglOUIuJTJDRGVjaSUyMyUyMGNlJTIwc3B1aSUyMyUyMHNkYXNkJTNGJTJDQ29sZWdpJTIwcCVDMyVBMm4lQzQlODMlMjBsYSUyMGNhcCVDNCU4M3QhJTIwTGV0J3MlMjBkbyUyMHRoaXMh=';

    var bubbles = decodeURIComponent(atob(optionsEncoded)).split(",");

    ctx.fillStyle = "rgb(106,195,140)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var encoder = new GIFEncoder();
    encoder.setRepeat(1);
    encoder.setDelay(2000);
    var tuLogo = './tuw/assets/tu96.png';
    loadImage(tuLogo).then((image) => {
        console.log('asset loaded');
        encoder.start();
        console.log(encoder.addFrame(ctx));

        var speechbubles = [];
        var verticalPos = 100;

        for (var i = 0; i < bubbles.length - 1; i++) {
            let dialogText = bubbles[i].split("#").join(",");
            let isMultiLine = false;
            if (bubbles[i].length > limitCharacters) {
                isMultiLine = true;
            }

            speechbubles[i] = new SpeechBubble({
                y: verticalPos,
                dialog: dialogText,
                multiLine: isMultiLine,
            }, ctx, encoder);

            if (isMultiLine) {
                verticalPos += 30;
            }

            verticalPos += 80;
        }

        function finalSpeech() {
            let x = 100;
            y = 650;
            height = 150;
            width = 280;
            dialog = bubbles[5]; // cta
            multiLine = false;

            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowOffsetY = 10;
            roundRect(ctx, x, y, width, height, 25, true, false);

            ctx.shadowOffsetY = 0;
            ctx.drawImage(image, x + 92, y - 48, 96, 96);

            ctx.fillStyle = "#FDD99F";
            roundRect(ctx, x, y + 75, width, 75, { tl: 0, tr: 0, bl: 25, br: 25 }, true, false);

            ctx.fillStyle = "#000";
            if (dialog.length > limitCharacters) {
                multiLine = true;
                dialog = breakString(dialog);
            }

            let posTextY = y + 105;
            posTextX = x + 20;

            if (multiLine) {
                dialog = dialog.split('\n');

                for (let i = 0; i < dialog.length; i++) {
                    if (i == 1) posTextX += (limitCharacters - dialog.length) * 3; //center the last segment of text
                    ctx.fillText(dialog[i], posTextX, posTextY + (i * lineheight));
                }
            } else {
                ctx.fillText(dialog, posTextX, posTextY);
            }
        }


        for (var i = 0; i < speechbubles.length; ++i) {
            speechbubles[i].draw();
        }

        finalSpeech();
        console.log(encoder.addFrame(ctx));
        encoder.finish();

        fs.appendFileSync('./tuw/invitations/inv.gif', new Buffer.from(encoder.download("download.gif")));
        res.send('Sucessfully downloaded');
    });
});



app.listen(port, () => console.log(`Listening app on port ${port}!`));


//fs.createReadStream('https://dev.tummy.ro/friendsInvite.gif').pipe(fs.createWriteStream('newLog.gif'));


   // });

