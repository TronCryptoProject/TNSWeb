const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const config = {
  devtool: "source-map",
  watch: false,
  context: __dirname,
  entry: [
	  path.join(__dirname, "client/js/index.js"),
	  path.join(__dirname,"client/style/index.css")
  ],
  output: {
	  filename: 'index.bundle.js',
	  path: __dirname + '/bundle',
	  publicPath: '/bundle/'
  },
  module: {
		rules: [
			{ 
				test: /\.jsx?$/,
			 	loader: 'babel-loader',
			  	exclude: /node_modules/,
			  	options: {
				  	presets: ['es2015', 'react']
			  	}
		  	},
		  	{
				test: /\.(scss|css)$/,
				exclude: /node_modules/,
				loader: ExtractTextPlugin.extract({
					use: ["css-loader","sass-loader"],
			  		fallback: "style-loader"
				})
		  	},
		  	{
            	test: /\.(png|jpg|gif|svg|mp4)$/,
            	loader: 'file-loader',
            	query: {
                	name: '[name].[ext]'
            	}
        	}
	  	]
  },
  resolve:{
	  	extensions: [".js", ".jsx", ".json"],
	  	modules: [path.join(__dirname,"node_modules"), path.join(__dirname, "client/js")]
  },
  plugins: [
	  	new ExtractTextPlugin("styles.css"),
	  	new webpack.DefinePlugin({
			'process.env.NODE_ENV': '"development"'
		}),
	  	new OptimizeCssAssetsPlugin({
			cssProcessor: require('cssnano'),
			cssProcessorOptions: { discardComments: { removeAll: true } },
			canPrint: true
	  	})
  ],
  optimization: {
  		minimizer: [
  			new UglifyJsPlugin({
				cache: true,
				parallel: true,
				uglifyOptions:{
					compress: false,
					ecma: 6,
					mangle: true
				},
				sourceMap: true
		  	})
  		]
  }
};

module.exports = config;
