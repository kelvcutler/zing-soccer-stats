var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');


function tsOptions(newOpts) {
  let options = {
    target: "es6",
    module: "amd",
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    removeComments: true

  }
  if (newOpts)
    for (let key in newOpts) {
      options[key] = newOpts[key];
    }
  return options;
}

gulp.task('default', ['client', 'server'], function () { });

gulp.task('clientjs', function () {
  return gulp.src(['client/main.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts(tsOptions({ sourceMap: true, outFile: "./client.js" })))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./war'));

});

gulp.task('styles', function () {
  return gulp.src('client/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./war'));

});

gulp.task('client', ['clientjs', 'styles'], function () { });


gulp.task('server', function () {
  return gulp.src(['server/main.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts(tsOptions({ sourceMap: true, outFile: "./server.js" })))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));

});

gulp.task('test', [], function () {
  return gulp.src(['test/main.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts(tsOptions({ outFile: "./test.js" })))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));
});