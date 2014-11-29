#!/usr/bin/env node

/*
 * cssimport
 * https://github.com/zafar-saleem/test
 *
 * Copyright (c) 2014 Zafar Saleem
 * Licensed under the MIT license.
 */

var hound = require('hound'),
	fs 	  = require('fs'),
	dir   = require('node-dir'),
	async = require('async'),
	replace = require('replace'),
	isOnlyOnce = true;

process.stdin.on('readable', function () {
	var command = process.stdin.read(),
		path = process.argv.slice(2),
		cachePath = path + '/.cachecss',
		stylesPath = path + '/styles.css';

	if (path == '-h') {
		console.log('\nUsage: cssimport <command>');
		console.log('\nwhere <command> is one of: ');
		console.log('\ncssimport -h                    quick help');
		console.log('\ncssimport path/to/css/folder    A path where all css files reside such as "styles"\n');
		process.exit(0);
	}

	async.waterfall([
			function (callback) {
				if (!command && !path) {
					console.log('No styles path was provided.');
					process.stdin.pause();
				} else {
					callback(null);
				}
			},

			function (callback) {
				if (isOnlyOnce) {
					console.log('\nAuto import CSS started and listening to ' + stylesPath);
					console.log('Press Ctrl + C to exit.');
					isOnlyOnce = false;
					dir.files(path + '/', function(err, files) {
					    if (err) { 
					    	console.log(err);
					    	process.exit(1);
					    }
					    if (files) {
					    	if (files.indexOf(cachePath) != 0) {
					    		// If .cachecss file does not exist then create it with empty string
					    		fs.writeFile(cachePath, '');
					    	}

					    	callback(null, files);
						}
					});
				}
			},

			function (files, callback) {
				fs.readFile(cachePath, 'utf8', function (err, data) {
					var cacheFiles = data.split('\n');
					
					for (var i = 0, len = files.length; i < len; i++) {
						if (cacheFiles.indexOf(files[i]) == -1 && files[i] != stylesPath) {
							var importFile = (files[i].substr(files[i].length - 4) == '.css') ? '@import "' + files[i] + '";\n': '';

							fs.appendFile(stylesPath, importFile, function (err, it) {
								if (err) {
									console.log(err);
									process.exit(1);
								}
							});
						}
					}
					
					callback(null, files);
				});
			},

			function (files, callback) {
		    	fs.readFile(cachePath, 'utf8', function (err, data) {
		    		if (err) {
		    			console.log(err);
		    			process.exit(1);
		    		}
					var cacheFiles = data.split('\n');
					for (var i = 0, len = files.length; i < len; i++) {
						if (cacheFiles.indexOf(files[i]) == -1) {
							fs.appendFile(cachePath, files[i] + '\n');
						}
					}
					callback(null, files);
				});
			},

			function (files) {
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
		], 
		function (err, results) {
			if (err) {
				console.log(err);
				return;
			}
			// console.log(results);
		}
	);
});

process.stdin.setEncoding('utf8');
process.stdin.resume();
