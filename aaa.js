const h3 = require('h3-js');

const h3Index = h3.geoToH3(37.3615593, -122.0553238, 7);
console.log(h3Index);