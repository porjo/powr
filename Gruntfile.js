module.exports = function(grunt) {
	'use strict';

	// load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.registerTask('build-dist', [ 'clean', 'continuous-common-minjs', 'css', 'copy:assets', 'copy:bower', 'copy:vendor']);

	grunt.registerTask('unit-tests', [ 'karma:continuous']);
	grunt.registerTask('coverage', [ 'coverage']);

	grunt.registerTask('continuous-js', [ 'jshint']);

	grunt.registerTask('continuous-common-minjs', [ 'preprocess:minjs', 'clean:js', 'ngtemplates', 'concat:js', 'ngAnnotate:minjs', 'uglify' ]);
	grunt.registerTask('continuous-common', [ 'preprocess:js', 'clean:js', 'ngtemplates', 'concat:js', 'ngAnnotate:js' ]);
	
	grunt.registerTask('css', ['concat:less', 'less:development', 'copy:css']);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		now: grunt.template.today("yyyymmddHHMMss"),
		jsname: '<%= pkg.name %>_<%= now %>',

		coverage: {
			options: {
				thresholds: {
					'statements': 100,
					'branches': 98,
					'lines': 100,
					'functions': 100
				},
				dir: 'coverage',
				root: ''
			}
		},

		preprocess: {
			js: {
				src : 'src/index.html',
				dest : 'dist/index.html',
				options : {
					context : {
						jsname : '<%= jsname %>.js',
						project : '<%= pkg.name %>',
					}
				}
			},
			minjs: {
				src : 'src/index.html',
				dest : 'dist/index.html',
				options : {
					context : {
						jsname : '<%= jsname %>.min.js',
						project : '<%= pkg.name %>',
					}
				}
			}
		},
		copy: {
			assets: {
				cwd: 'src/assets',
				src: [ 'img/**' ],
				dest: 'dist',
				expand: true
			},
			bower: {
				src: [ 'bower_components/**' ],
				dest: 'dist',
				expand: true
			},
			vendor: {
				src: [ 'vendor/**' ],
				dest: 'dist',
				expand: true
			},
			css: {
				src: 'tmp/app.css',
				dest: 'dist/css/app.css'
			}
		},
		// karma is used for unit-testing
		karma: {
			continuous: {
				configFile: 'karma.conf.js',
				singleRun: true
			}
		},
		ngtemplates:    {
			app:          {
				cwd: 'src/app',
				src: '**/*.html',
				dest: 'tmp/tmpl.js',
				options: {
					htmlmin:  { collapseWhitespace: true, collapseBooleanAttributes: true },
				}
			}
		},
		concat: {
			options: {
				separator: ';'
			},
			less: {
				options: {
					separator: ''
				},
				src: ['src/app/**/*.less'],
				dest: 'tmp/app.less',
			},
			js: {
				src: [
					'src/**/*.js', 
					'!src/**/*Spec.js', //don't include unit tests
					'!src/**/*e2e.js', //don't include e2e tests
					'<%= ngtemplates.app.dest %>'
				],
				dest: 'tmp/js/<%= jsname %>.js'
			}
		},
		// Uglify squashes plain JS
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd H:M o") %> */\n',
			},
			dist: {
				files: {
					'dist/js/<%= jsname %>.min.js': ['<%= ngAnnotate.minjs.dest %>']
				}
			}
		},
		// ngAnnotate squashes Angular controller/directive parameters
		ngAnnotate: {
			minjs: {
				src: ['<%= concat.js.dest %>'],
				dest: 'tmp/<%= jsname %>.ngAnnotate.js',
			},
			js: {
				src: ['<%= concat.js.dest %>'],
				dest: 'dist/js/<%= jsname %>.js',
			}
		},
		jshint: {
			gruntfile: [
				'Gruntfile.js'
			],
			files: [
				'src/**/*.js', 
			],
			options: {
				jshintrc: '.jshintrc',
			},
		},
		// protractor is used for end-to-end testing
		protractor: {
			e2e: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
				options: {
					configFile: "protractor.conf.js",
				}
			},
		},
		// Less files are scattered throughout project. Concat gathers them
		// together into tmp dir before being compiled by lessc
		less: {
			development: {
				options: {
					compress: true,
					relativeUrls: true,
				},
				files: { 'tmp/app.css': '<%= concat.less.dest %>' }
			}
		},
		watch: {
			gruntfile: {
				files: 'Gruntfile.js',
				tasks: ['jshint:gruntfile'],
			},
			css: {
				files: ['src/**/*.less'],
				tasks: ['css'],
			},
			html: {
				files: ['src/**/*.html'],
				tasks: ['continuous-common'],
			},
			js: {
				files: ['src/**/*.js'],
				tasks: ['continuous-js', 'continuous-common'],
			},
			assets: {
				files: ['src/assets/**'],
				tasks: ['clean:assets', 'copy:assets'],
			}
		},
		clean: {
			js: ['dist/js', 'tmp'],
			bower: ['dist/bower_components/**'],
			vendor: ['dist/vendor/**'],
			assets: ['dist/img/**'],
		},
	});
};

