'use strict';

var fs =                    require('fs'),
    gulp =                  require('gulp'),
    exist =                 require('gulp-exist'),
    newer =                 require('gulp-newer'),
    del =                   require('del'),
    less =                  require('gulp-less'),
    path =                  require('path'),
    sourcemaps =            require('gulp-sourcemaps'),
    LessAutoprefix =        require('less-plugin-autoprefix'),
    autoprefix =            new LessAutoprefix({ browsers: ['last 2 versions'] }),
    LessPluginCleanCSS =    require('less-plugin-clean-css'),
    cleanCSSPlugin =        new LessPluginCleanCSS({advanced: true}),


    input = {
        'html':                 ['*.html', '*.xhtml'],
        'templates':            'templates/**/*.html',
        'css':                  'resources/css/less/style.less',
        'vendor_css':           [
                                    'node_modules/bootstrap/dist/css/bootstrap.min.css' // v3.3.7
                                    ,'node_modules/jasny-bootstrap/dist/css/jasny-bootstrap.min.css'
                                    ,'node_modules/bootstrap-material-design/dist/css/bootstrap-material-design.min.css' // v0.5.10
                                    ,'/node_modules/bootstrap-material-design/dist/css/ripples.min.css' // v0.5.10
                                ],
        'scripts':              'resources/scripts/**/*',
        'vendor_js':            [
                                    'node_modules/jquery/dist/jquery.min.js' // v3.2.1
                                    ,'node_modules/bootstrap/dist/js/bootstrap.min.js' // v.3.3.7
                                    ,'node_modules/jasny-bootstrap/dist/js/jasny-bootstrap.min.js'
                                    ,'resources/scripts/vendor/jquery.ui.widget.js'
                                    ,'node_modules/bootstrap-material-design/dist/js/material.min.js' // v0.5.10
                                    ,'node_modules/bootstrap-material-design/dist/js/ripples.min.js' // v0.5.10
                                    ,'resources/scripts/vendor/bootstrap3-typeahead.min.js'
        ],
        'xml':                  'resources/xml/*.xml',
        'modules':              'modules/**/*',
        'images':               'resources/img/**/*',
        'fonts':                'bower_components/bootstrap/fonts/**/*'
    },
    output  = {
        'html':                 '.',
        'templates':            'templates',
        'css':                  'resources/css',
        'vendor_css':           'resources/css/vendor',
        'scripts':              'resources/scripts',
        'vendor_js':            'resources/scripts/vendor',
        'xml':                  'resources/xml',
        'modules':              'modules',
        'images':               'resources/img',
        'fonts':                'resources/fonts'
    }
    ;

// *************  existDB configuration *************** //

// var localConnectionOptions = {};
//
// if (fs.existsSync('./local.node-exist.json')) {
//     localConnectionOptions = require('./local.node-exist.json');
//     console.log('read from localConnectionOptions', localConnectionOptions)
// }
//
// var exClient = exist.createClient(localConnectionOptions);
//
// var targetConfiguration = {
//     target: '/db/apps/lgpn-search/'
// };

exist.defineMimeTypes({
    'application/xml': ['odd']
});

var exClient = exist.createClient({
    host: 'localhost',
    port: '8080',
    path: '/exist/xmlrpc',
    basic_auth: { user: 'admin', pass: '' }
});

var targetConfiguration = {
    target: '/db/apps/lgpn-search/',
    html5AsBinary: true
};

// ****************  Styles ****************** //

gulp.task('build:styles', function(){
    return gulp.src(input.css)
        .pipe(sourcemaps.init())
        .pipe(less({ plugins: [cleanCSSPlugin, autoprefix] }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(output.css))
});

gulp.task('deploy:styles', ['build:styles'], function () {
    console.log('deploying less and css files');
    return gulp.src(input.css, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

gulp.task('vendor_css:copy', function () {
    return gulp.src(input.vendor_css)
        .pipe(gulp.dest(output.vendor_css));
});

gulp.task('watch:styles', function () {
    console.log('watching less files');
    gulp.watch('resources/css/less/**/*.less', ['deploy:styles'])
});

// ****************  Fonts ****************** //

gulp.task('fonts:copy', function () {
    return gulp.src(input.fonts)
        .pipe(gulp.dest(output.fonts))
});

gulp.task('fonts:deploy', ['fonts:copy'], function () {
    return gulp.src(output.fonts, {base: '.'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// ****************  Scripts ****************** //

gulp.task('vendor_js:copy', function () {
    return gulp.src(input.vendor_js)
        .pipe(gulp.dest(output.vendor_js));
});

gulp.task('deploy:scripts', ['vendor_js:copy'], function () {
    return gulp.src(input.scripts, {base: '.'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Watch scripts
gulp.task('watch:scripts', function () {
    gulp.watch(input.scripts, ['deploy:scripts'])
});

// *************  Templates *************** //

// Deploy templates
gulp.task('deploy:templates', function () {
    return gulp.src(input.templates, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Watch templates
gulp.task('watch:templates', function () {
    gulp.watch(input.templates, ['deploy:templates'])
});

// *************  Modules *************** //

// Deploy modules
gulp.task('deploy:modules', function () {
    return gulp.src(input.modules, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Watch modules
gulp.task('watch:modules', function () {
    gulp.watch(input.modules, ['deploy:modules'])
});


// *************  HTML Pages *************** //

// Deploy HTML pages
gulp.task('deploy:html', function () {
    return gulp.src(input.html, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Watch HTML pages
gulp.task('watch:html', function () {
    gulp.watch(input.html, ['deploy:html'])
});

// *************  XML Pages *************** //

gulp.task('deploy:xml', function () {
    return gulp.src(input.xml, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Watch xml files
gulp.task('watch:xml', function () {
   gulp.watch(input.xml, ['deploy:xml'])
});

// *************  General Tasks *************** //

// Build styles and copy fonts
gulp.task('build-all', ['build:styles', 'fonts:copy', 'vendor_js:copy', 'vendor_css:copy']);

// Build styles and copy fonts
gulp.task('build', ['build:styles']);

// Watch files and trigger building styles and deployment to database
gulp.task('watch', ['build', 'deploy'], function () {
    gulp.watch(pathsToWatchAndDeploy, ['deploy'])
});

// Deploy files to existDB
var pathsToWatchAndDeploy = [
    'templates/**/*.html',
    'resources/**/*',
    'transform/*',
    '*.html',
    '*{.xpr,.xqr,.xql,.xml,.xconf}',
    'modules/**/*',
    'transform/*',
    '!build.*'
];

gulp.task('deploy', ['build'], function () {
    return gulp.src(pathsToWatchAndDeploy, {base: './'})
        .pipe(exClient.newer(targetConfiguration))
        .pipe(exClient.dest(targetConfiguration))
});

// Default task (which is called by 'npm start' task)
gulp.task('default', ['build-all']);
