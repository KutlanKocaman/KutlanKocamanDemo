const path = require('path');

module.exports = {
    mode: 'production', //development or production
    entry: { //Entry point for the webpack to start bundling.
        algorithms: './wwwroot/js/algorithms/algorithms.jsx'
    },
    output: {
        path: path.resolve(__dirname, './wwwroot/js/bundled'),
        filename: 'algorithms-bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)/, //js and jsx files.
                exclude: /node_modules/, //Exclude node_modules folder.
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ],
                        "plugins": [
                            [
                                "@babel/plugin-proposal-class-properties", //To enable class properties (including arrow functions).
                                {
                                    "loose": true
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    }
};