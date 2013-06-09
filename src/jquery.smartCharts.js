// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variable rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "smartChart",
				defaults = {
				chart : "pie"
		};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.container = $(element);
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}


		// Data should be specified in this format:
		// [
		//   [ label, first_value, second_value, color ],
		//   [                   ...                   ]
		// ]

		Plugin.prototype = {
				init: function () {
						$(this.container).empty()
						this.canvas = $("<canvas />",{
							id : this.container.attr('id') + "_smartChartCanvas"
						});
						this.canvas.appendTo(this.container);
						this.proportions = this.calcProportions(this.settings);

						console.log(this.canvas);

						var context = this.canvas[0].getContext("2d");
						if (this.settings.chart == "pie") {
							this.drawPie(this.canvas,context,this.proportions);
						};
				},

				refresh: function (options) {
					this.settings = $.extend( {}, defaults, options );
					this.init();
				},

				calcProportions: function (settings) {

					var temp;
					var result = [];

					var partialFirstSums = this.partialSumColumn(settings.data,1);
					var sumFirst = partialFirstSums[partialFirstSums.length-1];

					for (var i = 0; i < settings.data.length; i++) {
						var item = {};
						if (settings.chart == "pie") {
							item.start = proportionToRadians(partialFirstSums[i]/sumFirst);
							item.end = proportionToRadians(partialFirstSums[i+1]/sumFirst);
							item.color = settings.data[i][3]
						};
						result.push(item);
					};

					return result;
				},

				drawPie: function (canvas, context, proportions){

					var centerX = Math.floor(canvas.width() / 2);
					var centerY = Math.floor(canvas.height() / 2);
					var fullRadius = Math.min(centerX,centerY);
					
					function drawSegment(canvas,context,item){

						context.save();

						context.beginPath();
						context.moveTo(centerX,centerY);
						context.arc(centerX, centerY, fullRadius, item.start, item.end, false);
						context.closePath();

						context.fillStyle = item.color;
						context.fill();
						context.restore();

					}

					for (var i = proportions.length - 1; i >= 0; i--) {
						drawSegment(canvas,context,proportions[i]);
					};
				},

				partialSumColumn: function (data, column) {
					var result = [];
					var temp = 0;
					for (var i = 0; i < data.length; i++) {
						result.push(temp);
						temp += data[i][column];
					};
					result.push(temp);
					return result;
				}
		};



		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				return this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}else{
							$.data( this, "plugin_" + pluginName ).refresh(options)
						}
				});
		};


		// Helper functions:

		function proportionToRadians(proportion){
			return proportion*2*Math.PI;
		}

})( jQuery, window, document );
