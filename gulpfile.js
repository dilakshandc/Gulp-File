//var fs = require('fs');
// var changed = require('gulp-changed');
// var jscs = require('gulp-jscs');
//var splice = require('gulp-splice');
//var gulpSequence = require('gulp-sequence')
// var watch = require('glob-watcher');

var gulp = require('gulp');
var watch = require('gulp-watch');
var cache = require('gulp-cache');
var chokidar = require('chokidar');
var merge = require('merge-stream');
var filenames = require("gulp-filenames");
var browserify = require('browserify');
var watchify = require('watchify');
var path = require('path');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var uglifyjs = require('gulp-uglifyjs');
var sourcemaps = require('gulp-sourcemaps');
var livereload = require('gulp-livereload');
var es = require('event-stream');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var inject = require('gulp-inject');
var htmlmin = require('gulp-htmlmin');
let cleanCSS = require('gulp-clean-css');
var $ = require('gulp-load-plugins')({ lazy: true });
var wait = require('gulp-wait');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var sass = require('gulp-sass');



//defining our own paths.
var paths = {
    src: 'src/**/*',
    srcHTML: '/src/index.html',
    srcCSS: '/src/style.css',
    srcJS: 'src/**/*.js',

    tmp: 'tmp', // tmp folder
    tmpIndex: 'tmp/index.html', // index.html in tmp folder
    tmpCSS: 'tmp/*.css', // css files in tmp folder
    tmpJS: 'tmp/*.js', // js files in tmp folder

    dist: 'dist',
    distIndex: 'dist/index.html',
    distCSS: 'dist/**/*.css',
    distJS: 'dist/**/*.js'
};
//array for future use.
var array = [];

//path for the project root folder need to be watched
const defaultPath = "/var/www/html/meServer/otenro_server/59ed6c1ba7399ab3144c6c04/progressiveTemplates/"
//path for the node modules
const babelPresetPath = '/home/dilakshan/Desktop/gulp/node_modules/babel-preset-es2015';


//Testing  gulp-injet function 
gulp.task('test', () => {
    inj();
});

//gulp-inject function
var inj = function (myPath) {
    console.log("inject processing");
    console.log("my path :  " + myPath);

    var injectStyles = gulp.src([
        // selects all css files from the .tmp dir
        myPath + '/tmp/*.css'
    ], { read: false }
    );

    var injectScripts = gulp.src([
        // selects all js files from .tmp dir
        myPath + '/tmp/app2.js', myPath + '/tmp/app.js' ],{read: false});
    // tell wiredep where your bower_components are

    return gulp.src(myPath + '/tmp/index.html')
        .pipe($.inject(injectStyles, { relative: true }))
        .pipe($.inject(injectScripts, { relative: true }))
        // write the injections to the .tmp/index.html file
        .pipe(gulp.dest(myPath + '/tmp'));
    // so that src/index.html file isn't modified  
    // with every commit by automatic injects

};

//minifying html files when adding a new folder or, for available folders
var minify_html = function (myPath) {
    return gulp.src(myPath + '/src/**/*.html')
    // .pipe(concat('index.html'))    
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(myPath + '/' + paths.tmp));
};

//minifying css files when adding a new folder or, for available folders
var minify_css = function (myPath) {
    return gulp.src(myPath + '/src/**/*.css')
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        // .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(myPath + '/' + paths.tmp));
};


gulp.task('clear', function (done) {
    console.log("data cached");
    return cache.clearAll(done);
});


//watch task for file changes with *chokidar
gulp.task('watch', ['clear'], function (done) {
    // livereload.listen(1234);
        browserSync.reload();
    done();

});


//minifying html files when changes happen to the html files.
var minify_html_single = function (myPath_file) {
    // deletess(myPath_file);
    console.log('minifying single html');
    console.log('single html path  : ' + myPath_file);

    return gulp.src(myPath_file)
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('/home/dilakshan/Desktop/test folder'))

};


//minifying css files when changes happen to the css files.
var minify_css_single = function (myPath_file) {
    console.log('minifying single css');
    console.log('single css path  : ' + myPath_file);

    return gulp.src(myPath_file)
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('/home/dilakshan/Desktop/test folder'));
};




//-----------------------------------------------------------------------------------------------------
//restart gulp when gulpfile.js changes
//-----------------------------------------------------------------------------------------------------

// var restart = require('gulp-restart');

// * will restart the entire gulp on gulpfile.js change 
//  gulp.watch(['gulpfile.js'], restart);


//-----------------------------------------------------------------------------------------------------    



//transpiling newly added folders + their JavaScript files
var convertJS = function (paraPath) {
    console.log();
    var files = ["app","app2","app3"];
    return merge(files.map(function (file, ) {
        return browserify({ entries: paraPath + '/src/' + file + '/' + file + '.js'},{debug: true ,extensions: ['es6']})
            .transform("babelify", { presets: [babelPresetPath] })
            .bundle()
            .pipe(source(file + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglifyjs())
            .pipe(sourcemaps.write('./maps'))
            .pipe(gulp.dest(paraPath + '/tmp'))
            .pipe(browserSync.reload({stream: true}));
            }))


};


//——————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//browserify with watchify
//______________________________________________________________________________________________________________________________

//using watchify transpiling changed JavaScript files.

var bw = function (paraPath, changedFile) {
    console.log(paraPath);
    console.log(changedFile);
    var bundler = browserify({ entries: [paraPath + '/src/' + changedFile + '/' + changedFile + '.js'], debug: true })
        .transform("babelify", { presets: [babelPresetPath], compact: true })
    var bundle = function () {
        return bundler
            .bundle()
            .on('error', function () { })
            .pipe(source(changedFile + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglifyjs())
            .pipe(sourcemaps.write('./maps'))
            .pipe(gulp.dest(paraPath + '/tmp'))
            .pipe(browserSync.reload({stream: true}));
            }
    if (global.isWatching) {
        bundler = watchify(bundler);
        bundler.on('update', bundle);
    }
    return bundle();
}

//_____________________________________________________________________________________________________________________________


   
//default task when running  $ gulp
gulp.task('default', ['watch'],function(){


    browserSync.init({
       
            // port: 3000,
       
      proxy: {
          target: "http://localhost/meServer/otenro_server/", // can be [virtual host, sub-directory, localhost with port]
          ws: true // enables websockets
      },

      notify: false,
      open: false
      });

    // chokidar.watch(['public/*']).on('all', (event, path) => {
    //     console.log(event, path);
    //   });

    //watch task for adding new project folder
    chokidar.watch([defaultPath + '*'])
    .on('addDir', function (path) {
        console.log('File', path, 'has been added');
        convertJS(path);
        minify_html(path);
        minify_css(path);
        // setTimeout(function () {
        //     inj(path);
        // }, 600);

    })
    .on('unlinkDir', function (path) { console.log('Directory', path, 'has been removed'); })

// .on('addDir', function(path) {console.log('Directory', path, 'has been added');})

//watch task for file changes inside the project src 
chokidar.watch([defaultPath + '**/src/**/*.js'])
    .on('change', function (path, strats) {
        // console.log('File', path, 'has been changed');

        var str2 = path;
        console.log(str2)
        //tokenize the path
        var res = (str2.split('/'));

        //take only the project folder name
        var splice = res[res.length - 4];

        console.log('myPath io  : ' + splice)
        console.log('myPath file  : ' + res[res.length - 1]);

        var upperFolder = res[res.lengh];
        var myPath = defaultPath + splice;
        var changedFile = res[res.length - 2];
        console.log('myPath  : ' + myPath);
        bw(myPath, changedFile);
    })
// .on('unlink', function(path) {console.log('File', path, 'has been removed');})
// .on('unlinkDir', function(path) {console.log('Directory', path, 'has been removed');})
// .on('error', function(error) {console.error('Error happened', error);})


//watch task for css files inside the project folder.
chokidar.watch([defaultPath + '**/src/**/*.css'])
    // .on('add', function (file) {
    //     console.log('File', path, 'has been added');
    //     livereload.changed(file)

    // })
    // .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
    .on('change', function (file) {
        gulp.start('clear')
            gulp.src(file)
            .pipe(browserSync.stream());
        console.log('File', file, 'has been changed');
        // var str2 = file;
        // //tokenize the path
        // var res = (str2.split('/'));
        // console.log("io :  " + res[res.length - 3]);
        // var pathIo = res[res.length - 3];
        // //take only the project folder name
        // var splice = res[res.length - 5];

        // minify_css_single(file);
        // setTimeout(function () {
            // livereload.changed(defaultPath + pathIo)
        // }, 200);
    });


// //watch task for **scss files inside the project folder.
// chokidar.watch([defaultPath + '**/src/**/*.scss'])
// // .on('add', function (file) {
// //     console.log('File', path, 'has been added');
// //     livereload.changed(file)

// // })
// // .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
// .on('change', function (file) {
//     gulp.start('clear')
//         // gulp.src(file)
//         // .pipe(browserSync.stream());
//         return gulp.src(file)
//         .pipe(sass().on('error', sass.logError))
//         .pipe(gulp.dest('./src'));
//     console.log('File', file, 'has been changed');
   
// });


// gulp.task('sass', function () {
//     return gulp.src(defaultPath+'demo/src/style2.scss')
//       .pipe(sass().on('error', sass.logError))
//       .pipe(gulp.dest(defaultPath+'demo/src/'));
//   });



//watch task for html files on the project folder    
chokidar.watch([defaultPath + '**/src/**/*.html'])


    // .on('add', function(path) {console.log('File', path, 'has been added');})
    // .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
    .on('change', function (file) {
        gulp.start('clear')

        // console.log('File', file, 'has been added');
        // var str2 = file;
        // //tokenize the path
        // var res = (str2.split('/'));
        // console.log("io :  " + res[res.length - 3]);
        // var pathIo = res[res.length - 3];
        // //take only the project folder name
        // var splice = res[res.length - 5];
        // minify_html_single(pathIo);
        // var myPathHtml = defaultPath + pathIo;
        // setTimeout(function () {
            // inj(myPathHtml);
            browserSync.reload();
            
            // livereload.changed(defaultPath + pathIo)
        // }, 150);
    });
});

