var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    flatten = require('gulp-flatten'),
    gulpFilter = require('gulp-filter'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    mainBowerFiles = require('main-bower-files');

var dest_path =  'public/';

gulp.task('mainFiles', function() {
    var jsFilter = gulpFilter('*.js', {restore: true}),
        cssFilter = gulpFilter('*.css', {restore: true}),
        fontFilter = gulpFilter(['*.eot', '*.woff', '*.woff2', '*.svg', '*.ttf'], {restore: true});

    return gulp.src(mainBowerFiles(
        {
            paths: {
                bowerJson: 'bower.json',
                bowerDirectory: 'bower_components'
            },
            "overrides":{
                "bootstrap":{
                    "main":[
                        "less/bootstrap.less",
                        "dist/css/bootstrap.css",
                        "dist/js/bootstrap.js",
                        "dist/fonts/glyphicons-halflings-regular.eot",
                        "dist/fonts/glyphicons-halflings-regular.svg",
                        "dist/fonts/glyphicons-halflings-regular.ttf",
                        "dist/fonts/glyphicons-halflings-regular.woff",
                        "dist/fonts/glyphicons-halflings-regular.woff2"
                    ]
                },
                "lodash": {
                    "main": "dist/lodash.js"
                },
                "handlebars": {
                    "main": "handlebars.amd.js"
                }
            }
        }))
        .pipe(jsFilter)
        .pipe(gulp.dest(dest_path + 'js/vendor'))
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(dest_path + 'js/vendor'))
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(gulp.dest(dest_path + 'css'))
        .pipe(minifycss())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(dest_path + 'css'))
        .pipe(cssFilter.restore)
        .pipe(fontFilter)
        .pipe(flatten())
        .pipe(gulp.dest(dest_path + 'fonts'));
});

gulp.task('default', ['mainFiles']);