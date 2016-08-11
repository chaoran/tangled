const gulp = require('gulp');
const jshint = require('gulp-jshint');
const gmocha = require('gulp-mocha');
const stylish = require('jshint-stylish');

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

gulp.task('jshint', function() {
  return gulp.src(['*.js', 'lib/*.js', 'test/*.js']).
    pipe(jshint()).
    pipe(jshint.reporter(stylish)).
    pipe(jshint.reporter('fail'));
});

gulp.task('test', [ 'jshint' ], function() {
  return gulp.src(['test/*.js'], { read: false })
  .pipe(gmocha());
});

gulp.task('default', [ 'jshint', 'test' ]);
