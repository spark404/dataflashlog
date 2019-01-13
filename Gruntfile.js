module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    eslint: {
      target: ["dataflashlog.js"]
    },
    mocha_istanbul: {
      coverage: {
        src: ["test"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-mocha-istanbul");

  grunt.registerTask("default", ["eslint", "mocha_istanbul:coverage"]);
};