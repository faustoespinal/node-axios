const axios = require('axios')

console.log('axios sample client');

axios.get('https://httpbin.org/get').then(resp => {
    data = resp.data;
    console.log(data);
});



