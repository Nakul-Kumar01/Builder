
const validator = require('validator');


const validate = (data)=>{
    const mandatoryField = ['firstName','emailId','password'];

    const IsAllowed = mandatoryField.every((k)=> Object.keys(data).includes(k)); 

    if(!IsAllowed){
        throw new Error('Mandatory fields are missing');
    }
    // console.log("done1");
    if(data.firstName.lenght < 3 || data.firstName.length > 20){
        throw new Error('First name must be between 3 and 20 characters');
    }
    // console.log("done2");
    if(!validator.isEmail(data.emailId)){
        throw new Error('Invalid Email');
    }
    // console.log("done3");
    if(!validator.isStrongPassword(data.password)){
        throw new Error('week password');
    }
    // console.log("done4")
}

module.exports = validate;