/**
 * @file test.js
 * @brief Test driver for Swagger.js
 * @author Joel Haowen TONG
 * @version 0.1.1
 * @date 2013-07-19
 */


/** This test module embeds the image with a UTF-8 string (Korean and English),
 * using 2-layer encryption.  AES-256 cipher is first used, with a secret key.
 * Thereafter, the resultant crypted string is salted with the passphrase.
 *
 * Note: swagger.encrypt() and decrypt() return promises, which must then be listened for a result.
 *
 */

var swagger = require('../swagger')
    , Sequence = require('futures').sequence;


Sequence()
.then(function(next) {
    console.log('');
    console.log('--Testing ENCRYPT--')
    swagger.encrypt({
        inFile     : 'image.jpg',
        outFile    : 'output.jpg',
        msg        : 'hello world (안녕하세요! 잘지네세요?)',
        key        : 'bla bla',
        method     : 'aes-256-cbc',
        passphrase : 'blue dog'
    })

    .when(function(err, data) {
        console.log('[OUTPUT] image path: ' + data);
        next(data);
    
    });

})


.then(function(next, data) {
    console.log('--Testing DECRYPT--')
    swagger.decrypt({
        inFile     : data,
        outFile    : 'decrypted.txt',
        key        : 'bla bla',
        method     : 'aes-256-cbc',
        passphrase : 'blue dog'

    })

    .when(function(err, data) {
        if (err) {
            console.log(err);
        
        }
        console.log('[OUTPUT] Decrypted message: ' + data + '\n');

    });

});

