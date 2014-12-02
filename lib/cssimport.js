#!/usr/bin/env node

/*
 * cssimport
 * https://github.com/zafar-saleem/cssimport
 *
 * Copyright (c) 2014 Zafar Saleem
 * Licensed under the MIT license.
 */

var hound = require('hound'),
    fs    = require('fs'),
    path  = require('path'), // update
    dir   = require('node-dir'),
    async = require('async'),
    replace = require('replace'),
    isOnlyOnce = true;

process.stdin.on('readable', readUserCommand);

function readUserCommand () {
    var userCssFilePath   = process.argv.slice(2),
        isStylesFileExist = false,
        cachePath  = path.join(userCssFilePath.toString(), '.cachecss'), // update
        stylesPath = userCssFilePath + '/styles.css';
        version    = '0.1.22',
        listOfFunc = [];

    checkUserOptions(userCssFilePath);

    listOfFunc = [isWrongCommand, createCacheFile, insertCssFileInGlobal, appendCssToCache, watchCssFiles];

    async.waterfall(listOfFunc, isError);

    function isWrongCommand (callback) {
        if (!process.stdin.read() && !userCssFilePath) {
            console.log('No styles path was provided.');
            process.stdin.pause();
        } else {
            callback(null);
        }
    }

    function createCacheFile (callback) {
        if (isOnlyOnce) {
            console.log('\nAuto import CSS started and watching to ' + stylesPath);
            console.log('Press Ctrl + C to exit.');
            isOnlyOnce = false;
            dir.files(userCssFilePath + '/', function (err, files) {
                if (err) { 
                    console.log(err);
                    process.exit(1);
                }

                if (files) {
                    if (files.indexOf(stylesPath) >= 0) {
                        isStylesFileExist = true;
                    }
                    if (files.indexOf(cachePath) != 0) {
                        // If .cachecss file does not exist then create it with empty string
                        fs.writeFile(cachePath, '');
                    }

                    callback(null, files);
                }
            });
        }
    }

    function insertCssFileInGlobal (files, callback) {
        fs.readFile(cachePath, 'utf8', function (err, data) {
            var cacheFiles = data.split('\n');

            for (var i = 0, len = files.length; i < len; i++) {
                var currentCssFile = files[i].replace(/\\/g, '/'); // update

                if (isStylesFileExist) {
                    isStylesFileExist = false;
                    callback(null, files);
                    return;
                }

                if (cacheFiles.indexOf(currentCssFile) == -1 && currentCssFile != stylesPath) { // update
                    var importFile = (currentCssFile.substr(currentCssFile.length - 4) == '.css') ? '@import "' + currentCssFile + '";\n': ''; // update
                    
                    fs.appendFile(stylesPath, importFile, function (err, data) {
                        if (err) {
                            console.log(err);
                            process.exit(1);
                        }
                    });
                }
            }
            // console.log(files);
            callback(null, files);
        });
    }

    function appendCssToCache (files, callback) {
        fs.readFile(cachePath, 'utf8', function (err, data) {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            var cacheFiles = data.split('\n');
            for (var i = 0, len = files.length; i < len; i++) {
                if (cacheFiles.indexOf(files[i].replace(/\\/g, '/')) == -1) { // update
                    fs.appendFile(cachePath, files[i].replace(/\\/g, '/') + '\n'); // update
                }
            }
            callback(null, files);
        });
    }

    function watchCssFiles (files) {
        var watcher = hound.watch(process.argv[2]);

        watcher.on('create', function(file, stats) {
            console.log(file + ' was created');

            if (stats.isFile() && file && file != stylesPath && file != cachePath) {
                fs.appendFile(cachePath, file + '\n');

                fs.appendFile(stylesPath, '@import "' + file + '";\n', function (err) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }
                    console.log(file + ' imported to styles.css');
                });
            }
        });

        watcher.on('delete', function (file, stats) {
            replace({
                regex: new RegExp(file + '\n', 'g'),
                replacement: '',
                paths: [cachePath],
                recursive: true,
                silent: true,
            });

            replace({
                regex: new RegExp('@import "' + file + '";\n', 'g'),
                replacement: '',
                paths: [stylesPath],
                recursive: true,
                silent: true,
            });

            console.log(file + ' is deleted and removed from styles.css');
        });
    }

    function isError (err, results) {
        if (err) {
            console.log(err);
            return;
        }
        // console.log(results);
    }
}

function checkUserOptions (userCssFilePath) {
    var version = '0.1.21';

    if (userCssFilePath == '-h') {
        console.log('v' + version);
        console.log('\nUsage: cssimport <command>');
        console.log('\nwhere <command> is one of: ');
        console.log('cssimport -h                    quick help');
        console.log('cssimport -v                    displays version');
        console.log('cssimport path/to/css/folder    A path where all css files reside such as "styles"\n');
        process.exit(0);
    }

    if (userCssFilePath == '-v') {
        console.log(version);
        process.exit(0);
    }
}

process.stdin.setEncoding('utf8');
process.stdin.resume();
