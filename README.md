# cssimport

## Introduction
CSSimport is a command line tool that keeps watching to css files in a specified styles folder and import all css files into a single
file i.e. `styles.css`. Thus developers could simply import only `styles.css` in `index.html`. When new css files are created they
will automatically be imported into `styles.css` thus the importing of new css files becomes automatic.

## Getting Started
Install the module with: `npm install cssimport` to install locally or  `npm install -g cssimport` to install globally.

## Documentation
Once installed, use following command to start watching for styles folder.

```shell
cssimport styles
```

whereas `styles` is a folder in current directory. To view help simply use 

```shell
cssimport -h
```

## Contributing
If you face any issues then open an issue using github issue tracker. If contributers want to contribute in code then fork this repository, make your changes and then make a pull request. Thank you for understanding.

## Release History
* 2014-12-01   v0.1.21   Added -v parameter for version and Bug fix
* 2014-11-29   v0.1.20   Initial release
