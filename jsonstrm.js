var util = require('util');
var events = require('events');

var QUOTE = '"'.charCodeAt(0),
    BKSLASH = '\\'.charCodeAt(0),
    LBRACKET = '['.charCodeAt(0),
    RBRACKET = ']'.charCodeAt(0),
    LBRACE = '{'.charCodeAt(0),
    RBRACE = '}'.charCodeAt(0);

var JsonStream = function() {
    this.writable = true;

    this.buffer = null;
    this.objectLevel = 0;
    this.arrayLevel = 0;
    this.inString = false;
    this.inEsc = false;
};

util.inherits(JsonStream, events.EventEmitter);

var p = JsonStream.prototype;
p.write = function(buffer) {
    var b, i, ct;
    if(typeof buffer === 'string') {
        buffer = new Buffer(buffer);
    }
    if(this.buffer) {
        ct = this.buffer.length;
        b = buffer = this.buffer = Buffer.concat([this.buffer, buffer]);
    } else {
        ct = 0;
        b = this.buffer = buffer;
    }
    this.inString = this.inEsc = false;
    this.arrayLevel = this.objectLevel = 0;
    var start = 0;
    for(i=0; i<buffer.length; i++) {
        var c = buffer[i];
        if(this.inString)  {
            if(this.inEsc) {
                this.inEsc = false;
            } else if(c === QUOTE) {
                this.inString = false;
            } else if(c === BKSLASH) {
                this.inEsc = true;
            }
        } else {
            switch(c) {
                case QUOTE:
                    this.inString = true;
                    this.inEsc = false;
                    break;
                case LBRACKET:
                    this.arrayLevel++;
                    break;
                case RBRACKET:
                    this.arrayLevel--;
                    break;
                case LBRACE:
                    this.objectLevel++;
                    break;
                case RBRACE:
                    this.objectLevel--;
                    break;
                default:
                    break;
            }
        }
        if(!this.inString && this.objectLevel === 0 && this.arrayLevel === 0) {
            var data = buffer.slice(start, i+1);
            if(/\S/.test(data.toString())) {
                this.emit('data', data);
            }
            this.inEsc = 0;
            start = i+1;
        }
    }
    if(start >= buffer.length) {
        this.buffer = null;
    } else {
        this.buffer = buffer.slice(start);
    }
};

p.end = function(string, enc) {
    if(string) {
        this.write(string, enc);
    }
    // Should get rid of anything unwritten.
    if(this.buffer) {
        this.emit('data', this.buffer);
        this.buffer = null;
    }
    this.emit('end');
}

var newStream = function() {
    return new JsonStream;
};

exports.newStream = newStream;
