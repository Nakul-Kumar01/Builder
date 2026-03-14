
import axios from "axios";

// configuring the axios 
const axiosClient =  axios.create({
    baseURL: 'https://builder126.onrender.com/',  //base url of backend
    withCredentials: true,  // it means attach cookies with request
    headers: {
        'Content-Type': 'application/json'  // data ka format json hai
    }
});


export default axiosClient;