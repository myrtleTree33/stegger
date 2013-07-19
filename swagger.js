var http = require('http')
    , fs = require('fs')
    , crypto = require('crypto')
    , moment = require('moment')
    , shasum = crypto.createHash('sha1')
    , Sequence = require('futures').sequence 
    , Promise = require('future')
    , util = require("util")
    , exec = require("child_process").exec;


var steg = (function() {
    return {
        /* ----------------------------------------------------------------*/
        /**
         * @brief 
         *
         * @param arg {
         *      inFile      -- the file to read in
         *      msg         -- a message to encode
         *      key         -- a key to encode string
         *      method      -- the encryption method used to encode
         *      passphrase  -- a passphrase used by outguess
         *  }
         *
         * @return 
         */
        /* ------------------------------------------------------------------*/
        encrypt : function(arg) {

            var promise = Promise();

            new Sequence()

                .then(function(next) {
                    var cipher = crypto.createCipher(arg.method, arg.key);
                    var crypted = cipher.update(arg.msg,'utf8','hex') + 
                                    cipher.final('hex');

                    next(crypted);
                })


                .then(function(next, crypted) {
                    var filename = moment().valueOf().toString(36).toString('utf8') + '.txt';
                    fs.writeFile(filename, crypted, function(err, data) {
                        if (err) {
                            console.err('There was an error');
                        }
                        next(filename);
                    
                    });
                }) 


                .then(function(next, filename) {
                    var outFilename = moment().valueOf().toString(36).toString('utf8') + '.jpg';
                    next(filename, outFilename);
                
                })


                .then(function(next, filename, outFilename) {
                    // ensure .jpg extension, else won't work
                    if (arg.inFile.slice(-3) !== 'jpg' &&
                        arg.inFile.slice(-4) !== 'jpeg') {
                            console.log(arg.inFile);

                        var newName = arg.inFile + '.jpg';
                        fs.rename(arg.inFile, newName, function(err) {
                            if (err) {
                                throw err;

                            }

                            arg.inFile = newName;
                            
                            next(filename, outFilename);
                        
                        });
                        
                    } else {
                        next(filename, outFilename);
                    }
                })


                .then(function(next, filename, outFilename) {
                    var cmd = "outguess -k \'" + arg.passphrase + "\' -d  " + filename + " " + arg.inFile + " " + outFilename;
                    exec(cmd , function(err, stdout, stderr) {
                        next(filename, outFilename);

                    });
                
                })


                .then(function(next, filename, outFilename) {
                    fs.unlink(filename, function() {
                        promise.fulfill(undefined, outFilename);
                        next();
                    
                    });
                });


                return promise;

        },


        /* ----------------------------------------------------------------*/
        /**
         * @brief 
         *
         * @param arg {
         *      inFile      -- the file to read in (an image)
         *      outFile     -- the file to write out the message
         *      key         -- a key to encode string
         *      method      -- the encryption method used to encode
         *      passphrase  -- a passphrase used by outguess
         *  }
         *
         * @return a promise, with a callback signature (err, message)
         */
        /* ------------------------------------------------------------------*/
        decrypt : function(arg) {

            var promise = Promise();

            new Sequence()
                .then(function(next) {
                    // ensure .jpg extension, else won't work
                    if (arg.inFile.slice(-3) !== 'jpg' &&
                        arg.inFile.slice(-4) !== 'jpeg') {
                            console.log(arg.inFile);

                        var newName = arg.inFile + '.jpg';
                        fs.rename(arg.inFile, newName, function(err) {
                            if (err) {
                                throw err;

                            }

                            arg.inFile = newName;
                            
                            next();
                        
                        });
                        
                    } else {
                        next();
                    }
                })


                .then(function(next) {
                    var filename = moment().valueOf().toString(36).toString('utf8') + '.txt';
                    var cmd = "outguess -k \'" + arg.passphrase + "\' -r " + arg.inFile + " " + filename;
                    exec(cmd , function(err, stdout, stderr) {
                        next(filename);

                    });
                
                })


                .then(function(next, filename) {
                    fs.readFile(filename, function(err, data) {
                        next(data, filename);
                    
                    });
                })


                .then(function(next, data, filename) {
                    try {
                        //if (data.isString('utf8')) {
                            //console.log('is string!');

                        
                        //} else {
                            //console.log('not string!');
                        
                        //}
                        var decipher = crypto.createDecipher(arg.method, arg.key);
                        var dec = decipher.update(data.toString('utf8'), 'hex', 'utf8');
                        dec += decipher.final('utf8');
                        if (dec === '') {
                            promise.fulfill(true, dec);

                        } else {
                            promise.fulfill(undefined, dec);
                        
                        }

                        next(filename);
                    
                    /* Invalid cipher */
                    } catch (ex) {
                        promise.fulfill(true, dec);
                        next(filename);
                    
                    }

                    
                })


                .then(function(next, filename) {
                    fs.unlink(filename, function() {
                        next();
                    
                    });
                });


            return promise;
            
        }
    }

})();


module.exports = steg;
