const gulp = require('gulp');
const fs = require("fs");
const modifyFile = require('gulp-modify-file')
const rename = require('gulp-rename');
const pkg = require('./package.json');

let _dist = pkg.main.split(/\//)
const name = _dist.pop()
const dist = _dist.join('/')

const DIST = process.env.ICLOUD || "~/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents";
const CONFIG_FILE = 'config.json';

const getData = () => {
  const f = fs.readFileSync(CONFIG_FILE, {encoding: 'UTF-8'});
  return JSON.parse(f)
}

const generateCode = (content) => {
  const data = getData();
  return `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: ${data.icon.color}; icon-glyph: ${data.icon.glyph};
${content}`
}


gulp.task('copy', (done) => {
    gulp.src(pkg.source)
      .pipe(modifyFile(generateCode))
      .pipe(rename(name))
      .pipe(gulp.dest(DIST))
      .pipe(gulp.dest(dist));
    done();
  }
)

gulp.task('build', (done) => {
    gulp.src(pkg.source)
      .pipe(modifyFile(generateCode))
      .pipe(modifyFile((content) => {
        const data = getData();
        data.script = content
        return JSON.stringify(data, null, 2)
      }))
      .pipe(rename(`${name.split('.')[0]}.scriptable`))
      .pipe(gulp.dest(dist));
    done();
  }
)

gulp.task('watch', () => {
  gulp.watch(pkg.source, gulp.series('copy', 'build'));
})

gulp.task('default', gulp.series('watch'))
