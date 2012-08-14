var should = require('should');
var jsonstrm = require('../jsonstrm');

describe('jsonstrm', function() {
    it('should exist', function() {
        var strm = jsonstrm.newStream();
        should.exist(strm);
    });

    it('should pass through simple javascript', function(done) {
        var strm = jsonstrm.newStream();
        var tdat = { foo: "bar" };
        strm.on('data', function(data) {
            var o = JSON.parse(data.toString());
            o.should.eql(tdat);
            done();
        });
        strm.write(JSON.stringify(tdat));
    });

    it('should handle several concatenated objects', function(done) {
        var strm = jsonstrm.newStream();
        var tdat = [{ foo: "bar" }, [1, 2, 3], { baz: 17 }];
        var num = 0;
        var i=0;
        strm.on('data', function(data) {
            var o = JSON.parse(data.toString());
            o.should.eql(tdat[num]);
            num++;
        });
        strm.on('end', function() {
            should.equal(num, tdat.length);
            done();
        });

        var t = "";
        for(i=0; i<tdat.length; i++) {
            t += JSON.stringify(tdat[i]);
        }
        strm.write(t);
        strm.end();
    });

    it('should handle split stuff', function(done) {
        var strm = jsonstrm.newStream();
        var tdat = '{ "foo" : "bar"}';
        var j = tdat;
        var j0 = j.substring(0, 5);
        var j1 = j.slice(5);
        strm.on('data', function(data) {
            var o = JSON.parse(data.toString());
            o.should.eql({ foo: "bar"});
            done();
        });
        strm.write(j0);
        strm.write(j1);
    });

    it('should not emit pure whitespace', function(done) {
        var strm = jsonstrm.newStream();
        strm.on('data', function(data) {
            var s = data.toString();
            s.should.not.match(/^\s*$/);
        });
        strm.on('end', done);
        strm.write('   ');
        strm.write('{}');
        strm.write('   ');
        strm.write('[]   ');
        strm.end();
    });
});
