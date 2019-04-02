const fs = require('fs');
eval(fs.readFileSync('./tuw/js/canvasHelper.js') + '');

const lineheight = 30,
    limitCharacters = 35;

class SpeechBuble {
    constructor(params, ctx, encoder) {
        if (!ctx || encoder) {
            new Error('Please provide a context')
        }
        this.x = params.x || 100;
        this.y = params.y || 0;
        this.width = params.width || 280;
        this.height = params.height || 50;
        this.fillStyle = params.fillStyle || "#FFFFFF";
        this.strokeStyle = params.strokeStyle || "#000000";
        this.lineWidth = params.lineWidth || 0;
        this.dialog = params.dialog || '';
        this.multiLine = params.multiLine || false;
        this.context = ctx;
        this.encoder = encoder
    }
       


    draw() {
        if (this.fillStyle) {
            if (this.multiLine) {
                this.height += 30;
                this.dialog = breakString(this.dialog);
            }
            var ctx = this.context;
            var encoder = this.encoder;
            
            ctx.fillStyle = this.fillStyle;
            roundRect(ctx, this.x, this.y, this.width, this.height, 25, true, false);
            ctx.fillStyle = '#fff';
            drawArrowhead(ctx, { x: this.x + 138, y: this.y }, { x: this.x + 138, y: (this.multiLine == true) ? this.y + 84 : this.y + 54 }, 10);
            ctx.fillStyle = "#000";
            ctx.font = "18px Arial";
            if (this.multiLine) {
                var lines = this.dialog.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (i == 0) { this.y += 30; }
                    ctx.fillText(lines[i], this.x + 20, this.y + (i * lineheight));
                }
            } else {
                ctx.fillText(this.dialog, this.x + 20, this.y + 32);
            }
    
            console.log(encoder.addFrame(ctx));
        }
    
        if (this.strokeStyle && this.lineWidth) {
            ctx.strokeStyle = this.strokeStyle;
            ctx.lineWidth = this.lineWidth;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    finalSpeech() {

    }
}
module.exports = SpeechBuble;