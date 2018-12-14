# OpenLayers + Webpack  example1

This example demonstrates how the `ol` package can be used with webpack.

Clone the project.

    git clone https://github.com/tianhongguo/openlayersDemo.git
    
Redefine serverUrl as your arcgis service in main.js file or use 'https://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PDX_Pedestrian_Districts/FeatureServer/'

Install the project dependencies.

    cd ol-webpack
    npm install

Create a bundle for the browser.

    npm run build

Open `index.html` to see the result.

    open index.html
