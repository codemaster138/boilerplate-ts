#!/usr/bin/env node

const { prompt } = require("enquirer");
const chalk = require("chalk");
const npmview = require("npmview");
const ora = require("ora");
const fs = require("fs");
const path = require("path");
const ncp = require("ncp");
const execa = require("execa");

/**
 * Get the latest version of a package
 * @param {string} package Package name
 */
function getPackageLatest(package) {
  return new Promise((resolve, reject) => {
    npmview(package, (err, version) => {
      if (err) return reject(err);
      resolve(version);
    });
  });
}

/**
 * Promisification of [`ncp`](https://npmjs.com/package/ncp)
 * @param {string} source Source directory or file
 * @param {string} destination Target directory or file
 */
function ncpPromise(source, destination) {
  return new Promise((resolve, reject) => {
    ncp(source, destination, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

(async () => {
  // Ask some questions
  const {
    name,
    description,
    repository,
    author,
    package_manager,
  } = await prompt([
    {
      name: "name",
      message: "Package name:",
      type: "input",
      prefix: "❯",
    },
    {
      name: "description",
      message: "Description:",
      type: "input",
      prefix: "❯",
    },
    {
      name: "repository",
      message: `Git Repo ${chalk.gray("optional")}`,
      type: "input",
      prefix: "❯",
    },
    {
      name: "author",
      message: `Author ${chalk.gray("Default: unknown")}`,
      type: "input",
      prefix: "❯",
    },
    {
      name: "package_manager",
      message: `Choose your preferred package manager`,
      type: "select",
      choices: ["yarn", "npm"],
      prefix: "❯",
    },
  ]);

  const spinner = ora().start("Creating package.json & tsconfig.json...");
  // Create a package.json file
  const package_json = {
    name: name,
    version: "0.0.0",
    description: description,
    main: "dist/index.js",
    scripts: {
      build: "tsc",
      dev: 'nodemon -e ts --exec "npm run build"',
      prepublish: `${package_manager}${
        package_manager === "npm" ? " run" : ""
      } build`,
    },
    author: author || "unknown",
    license: "MIT",
    devDependencies: {
      nodemon: "^" + (await getPackageLatest("nodemon")),
      typescript: "^" + (await getPackageLatest("typescript")),
    },
  };
  // TSConfig
  const tsconfig_json = `{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig.json to read more about this file */

    /* Basic Options */
    // "incremental": true,                   /* Enable incremental compilation */
    "target": "es5",                          /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', or 'ESNEXT'. */
    "module": "commonjs",                     /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', 'es2020', or 'ESNext'. */
    // "lib": [],                             /* Specify library files to be included in the compilation. */
    // "allowJs": true,                       /* Allow javascript files to be compiled. */
    // "checkJs": true,                       /* Report errors in .js files. */
    // "jsx": "preserve",                     /* Specify JSX code generation: 'preserve', 'react-native', or 'react'. */
    // "declaration": true,                   /* Generates corresponding '.d.ts' file. */
    // "declarationMap": true,                /* Generates a sourcemap for each corresponding '.d.ts' file. */
    // "sourceMap": true,                     /* Generates corresponding '.map' file. */
    // "outFile": "./",                       /* Concatenate and emit output to single file. */
    "outDir": "./dist",                       /* Redirect output structure to the directory. */
    "rootDir": "./src",                       /* Specify the root directory of input files. Use to control the output directory structure with --outDir. */
    // "composite": true,                     /* Enable project compilation */
    // "tsBuildInfoFile": "./",               /* Specify file to store incremental compilation information */
    // "removeComments": true,                /* Do not emit comments to output. */
    // "noEmit": true,                        /* Do not emit outputs. */
    // "importHelpers": true,                 /* Import emit helpers from 'tslib'. */
    // "downlevelIteration": true,            /* Provide full support for iterables in 'for-of', spread, and destructuring when targeting 'ES5' or 'ES3'. */
    // "isolatedModules": true,               /* Transpile each file as a separate module (similar to 'ts.transpileModule'). */

    /* Strict Type-Checking Options */
    "strict": true,                           /* Enable all strict type-checking options. */
    // "noImplicitAny": true,                 /* Raise error on expressions and declarations with an implied 'any' type. */
    // "strictNullChecks": true,              /* Enable strict null checks. */
    // "strictFunctionTypes": true,           /* Enable strict checking of function types. */
    // "strictBindCallApply": true,           /* Enable strict 'bind', 'call', and 'apply' methods on functions. */
    // "strictPropertyInitialization": true,  /* Enable strict checking of property initialization in classes. */
    // "noImplicitThis": true,                /* Raise error on 'this' expressions with an implied 'any' type. */
    // "alwaysStrict": true,                  /* Parse in strict mode and emit "use strict" for each source file. */

    /* Additional Checks */
    // "noUnusedLocals": true,                /* Report errors on unused locals. */
    // "noUnusedParameters": true,            /* Report errors on unused parameters. */
    // "noImplicitReturns": true,             /* Report error when not all code paths in function return a value. */
    // "noFallthroughCasesInSwitch": true,    /* Report errors for fallthrough cases in switch statement. */
    // "noUncheckedIndexedAccess": true,      /* Include 'undefined' in index signature results */

    /* Module Resolution Options */
    // "moduleResolution": "node",            /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
    // "baseUrl": "./",                       /* Base directory to resolve non-absolute module names. */
    // "paths": {},                           /* A series of entries which re-map imports to lookup locations relative to the 'baseUrl'. */
    // "rootDirs": [],                        /* List of root folders whose combined content represents the structure of the project at runtime. */
    // "typeRoots": [],                       /* List of folders to include type definitions from. */
    // "types": [],                           /* Type declaration files to be included in compilation. */
    // "allowSyntheticDefaultImports": true,  /* Allow default imports from modules with no default export. This does not affect code emit, just typechecking. */
    "esModuleInterop": true,                  /* Enables emit interoperability between CommonJS and ES Modules via creation of namespace objects for all imports. Implies 'allowSyntheticDefaultImports'. */
    // "preserveSymlinks": true,              /* Do not resolve the real path of symlinks. */
    // "allowUmdGlobalAccess": true,          /* Allow accessing UMD globals from modules. */

    /* Source Map Options */
    // "sourceRoot": "",                      /* Specify the location where debugger should locate TypeScript files instead of source locations. */
    // "mapRoot": "",                         /* Specify the location where debugger should locate map files instead of generated locations. */
    // "inlineSourceMap": true,               /* Emit a single file with source maps instead of having a separate file. */
    // "inlineSources": true,                 /* Emit the source alongside the sourcemaps within a single file; requires '--inlineSourceMap' or '--sourceMap' to be set. */

    /* Experimental Options */
    // "experimentalDecorators": true,        /* Enables experimental support for ES7 decorators. */
    // "emitDecoratorMetadata": true,         /* Enables experimental support for emitting type metadata for decorators. */

    /* Advanced Options */
    "skipLibCheck": true,                     /* Skip type checking of declaration files. */
    "forceConsistentCasingInFileNames": true  /* Disallow inconsistently-cased references to the same file. */
  }
}
`;

  const directory = process.argv[2] || ".";
  if (!fs.existsSync(directory)) fs.mkdirSync(directory);
  else if (fs.statSync(directory).isFile()) {
    spinner.stop();
    const { proceed } = await prompt({
      name: "proceed",
      type: "confirm",
      message: "A file exists at this path. Overwrite?",
    });
    if (proceed) {
      fs.unlinkSync(directory);
      fs.mkdirSync(directory);
      spinner.start();
    } else {
      spinner.start().fail("Not overwriting file at path " + directory);
      process.exit(1);
    }
  } else if (fs.readdirSync(directory).length > 0) {
    spinner.stop();
    const { proceed } = await prompt({
      name: "proceed",
      type: "confirm",
      message: "The directory at this path is not empty. Overwrite?",
    });
    if (proceed) {
      fs.unlinkSync(directory);
      fs.mkdirSync(directory);
      spinner.start();
    } else {
      spinner.start().fail("Not overwriting files in directory " + directory);
      process.exit(1);
    }
    spinner.start();
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), directory, "package.json"),
    JSON.stringify(package_json, null, 2)
  );

  fs.writeFileSync(
    path.resolve(process.cwd(), directory, "tsconfig.json"),
    tsconfig_json
  );

  spinner.succeed().start("Copying template...");

  await ncpPromise(path.resolve(__dirname, "./template"), directory);

  process.chdir(directory);
  spinner.succeed().start("Installing dependencies. This may take a while. ");

  await execa(package_manager, [package_manager === "npm" ? "install" : ""]);

  spinner.succeed();

  console.log("\n✨Done!");
  console.log(`You can start developing now! 🚀`);

  if (repository) package_json.repository = repository;
})();
